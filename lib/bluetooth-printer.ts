/* Web Bluetooth API type declarations (not in default TS lib) */
interface BluetoothRequestDeviceFilter {
  services?: BluetoothServiceUUID[]
  name?: string
  namePrefix?: string
}
type BluetoothServiceUUID = string | number
interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[]
  optionalServices?: BluetoothServiceUUID[]
  acceptAllDevices?: boolean
}
interface BluetoothCharacteristicProperties {
  readonly write: boolean
  readonly writeWithoutResponse: boolean
}
interface BluetoothRemoteGATTCharacteristic {
  readonly properties: BluetoothCharacteristicProperties
  writeValueWithResponse(value: BufferSource): Promise<void>
  writeValueWithoutResponse(value: BufferSource): Promise<void>
}
interface BluetoothRemoteGATTService {
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristic[]>
}
interface BluetoothRemoteGATTServer {
  readonly connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
}
interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
}
interface Bluetooth {
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
}
declare global {
  interface Navigator {
    bluetooth: Bluetooth
  }
}

export type BluetoothPrinterState = 'disconnected' | 'connecting' | 'connected' | 'error';

export type PrinterDeviceInfo = {
  id: string;
  name: string;
};

const THERMAL_PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common thermal printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Generic serial
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC serial
];

export class BluetoothPrinterTransport {
  private _state: BluetoothPrinterState = 'disconnected';
  private _deviceInfo: PrinterDeviceInfo | null = null;
  private _error: string | null = null;
  private _device: BluetoothDevice | null = null;
  private _server: BluetoothRemoteGATTServer | null = null;
  private _characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  onStateChange?: (state: BluetoothPrinterState) => void;

  get state(): BluetoothPrinterState {
    return this._state;
  }

  get deviceInfo(): PrinterDeviceInfo | null {
    return this._deviceInfo;
  }

  get error(): string | null {
    return this._error;
  }

  private setState(state: BluetoothPrinterState): void {
    this._state = state;
    this.onStateChange?.(state);
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async requestDevice(): Promise<PrinterDeviceInfo> {
    if (!BluetoothPrinterTransport.isSupported()) {
      throw new Error('Web Bluetooth API is not supported in this browser');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: THERMAL_PRINTER_SERVICE_UUIDS.map((uuid) => ({
          services: [uuid],
        })),
        optionalServices: THERMAL_PRINTER_SERVICE_UUIDS,
      });

      this._device = device;
      this._deviceInfo = {
        id: device.id,
        name: device.name ?? 'Unknown Printer',
      };

      device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      return this._deviceInfo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request Bluetooth device';
      this._error = message;
      this.setState('error');
      throw new Error(message);
    }
  }

  async connect(deviceId?: string): Promise<void> {
    if (!this._device && !deviceId) {
      throw new Error('No device available. Call requestDevice() first or provide a deviceId.');
    }

    this.setState('connecting');
    this._error = null;

    try {
      // If a deviceId is provided but we don't have a matching device, request one
      if (deviceId && (!this._device || this._device.id !== deviceId)) {
        await this.requestDevice();
      }

      const device = this._device;
      if (!device || !device.gatt) {
        throw new Error('Bluetooth device or GATT server not available');
      }

      const server = await device.gatt.connect();
      this._server = server;

      // Try each known service UUID to find a writable characteristic
      let writableCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

      for (const serviceUuid of THERMAL_PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          const characteristics = await service.getCharacteristics();

          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writableCharacteristic = char;
              break;
            }
          }

          if (writableCharacteristic) break;
        } catch {
          // Service not available on this device, try the next one
          continue;
        }
      }

      if (!writableCharacteristic) {
        throw new Error('No writable characteristic found on the printer');
      }

      this._characteristic = writableCharacteristic;
      this.setState('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to printer';
      this._error = message;
      this.setState('error');
      throw new Error(message);
    }
  }

  async print(data: Uint8Array, chunkSize = 512, chunkDelay = 50): Promise<void> {
    if (this._state !== 'connected' || !this._characteristic) {
      throw new Error('Printer is not connected');
    }

    const characteristic = this._characteristic;
    const useWriteWithoutResponse = characteristic.properties.writeWithoutResponse;

    for (let offset = 0; offset < data.length; offset += chunkSize) {
      const chunk = data.slice(offset, Math.min(offset + chunkSize, data.length));

      if (useWriteWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValueWithResponse(chunk);
      }

      // Delay between chunks to avoid overwhelming the printer buffer
      if (offset + chunkSize < data.length && chunkDelay > 0) {
        await new Promise((resolve) => setTimeout(resolve, chunkDelay));
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this._device) {
      this._device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
    }

    if (this._server?.connected) {
      this._server.disconnect();
    }

    this._characteristic = null;
    this._server = null;
    this.setState('disconnected');
  }

  private handleDisconnect = (): void => {
    this._characteristic = null;
    this._server = null;
    this.setState('disconnected');
  };
}

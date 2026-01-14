import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Book, FileQuestion } from "lucide-react"

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Get Help</h1>
        <p className="text-muted-foreground">Support resources and documentation for your Kitchen System.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Need assistance? Our support team is here to help.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Email us directly for any issues or questions you might have.
            </p>
            <Button asChild className="w-full">
              <a href="mailto:support@kitchensystem.app">
                Email Support
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Documentation
            </CardTitle>
            <CardDescription>
              Read our guides and documentation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Detailed guides on how to use every feature of the Kitchen System.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileQuestion className="h-5 w-5" />
              FAQ
            </CardTitle>
            <CardDescription>
              Frequently Asked Questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Find answers to common questions about the system.
            </p>
            <Button variant="outline" className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="font-medium">App Version</div>
                <div className="text-muted-foreground">1.0.0</div>
                <div className="font-medium">Status</div>
                <div className="text-green-600 font-medium">Operational</div>
            </div>
          </CardContent>
      </Card>
    </div>
  )
}

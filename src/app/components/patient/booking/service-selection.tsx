"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DollarSign, Clock, Info } from "lucide-react"

interface Service {
  id: string
  name: string
  price?: number
  category: string
  description?: string
  duration?: number
  preparation?: string
}

interface Clinic {
  id: string
  name: string
  services: Service[]
}

interface ServiceSelectionProps {
  clinic: Clinic
  onSelectService: (service: Service) => void
}

export function ServiceSelection({ clinic, onSelectService }: ServiceSelectionProps) {
  const groupedServices = clinic.services.reduce(
    (acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = []
      }
      acc[service.category].push(service)
      return acc
    },
    {} as Record<string, Service[]>,
  )

  return (
    <div className="space-y-6">
      {Object.entries(groupedServices).map(([category, services]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4 capitalize">{category}</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      {service.description && <CardDescription className="mt-1">{service.description}</CardDescription>}
                    </div>
                    <Badge variant="secondary">{service.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {service.price && (
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">${service.price}</span>
                      </div>
                    )}

                    {service.duration && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{service.duration} minutes</span>
                      </div>
                    )}
                  </div>

                  {service.preparation && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span>Preparation</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{service.preparation}</p>
                      </div>
                    </>
                  )}

                  <Button onClick={() => onSelectService(service)} className="w-full">
                    Select Service
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

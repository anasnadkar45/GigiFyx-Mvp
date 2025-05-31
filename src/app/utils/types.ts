export interface Clinic {
  id: string
  name: string
  address: string
  phone: string
  description: string
  image?: string
  status: string
  owner: {
    name: string
    email: string
  }
  createdAt: string
}
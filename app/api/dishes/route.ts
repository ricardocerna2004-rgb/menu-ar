import { NextResponse } from 'next/server'
import { getAllDishes, createDish } from '@/lib/dishes'

export async function GET() {
  const dishes = getAllDishes()
  return NextResponse.json(dishes)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, description, price, category, modelPath, restaurantName } = body

  if (!name || !modelPath) {
    return NextResponse.json({ error: 'Nombre y modelo son requeridos' }, { status: 400 })
  }

  const dish = createDish({ name, description, price, category, modelPath, restaurantName })
  return NextResponse.json(dish, { status: 201 })
}

import { NextResponse } from 'next/server'
import { getDishById, deleteDish } from '@/lib/dishes'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const dish = getDishById(params.id)
  if (!dish) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(dish)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const ok = deleteDish(params.id)
  if (!ok) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json({ success: true })
}

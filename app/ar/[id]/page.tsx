import { getDishById } from '@/lib/dishes'
import { notFound } from 'next/navigation'
import ARViewer from '@/components/ARViewer'

export default async function ARPage({ params }: { params: { id: string } }) {
  const dish = getDishById(params.id)
  if (!dish) notFound()

  return <ARViewer dish={dish} />
}

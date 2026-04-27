import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface Dish {
  id: string
  name: string
  description: string
  price: string
  category: string
  modelPath: string
  restaurantName: string
  realWidthCm: number   // diámetro/ancho real del platillo en centímetros
  createdAt: string
}

const DATA_FILE = path.join(process.cwd(), 'data', 'dishes.json')

function ensureDataFile() {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf-8')
}

export function getAllDishes(): Dish[] {
  ensureDataFile()
  const raw = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(raw) as Dish[]
}

export function getDishById(id: string): Dish | null {
  const dishes = getAllDishes()
  return dishes.find((d) => d.id === id) ?? null
}

export function createDish(data: Omit<Dish, 'id' | 'createdAt'>): Dish {
  const dishes = getAllDishes()
  const dish: Dish = { ...data, id: uuidv4(), createdAt: new Date().toISOString() }
  dishes.push(dish)
  fs.writeFileSync(DATA_FILE, JSON.stringify(dishes, null, 2), 'utf-8')
  return dish
}

export function deleteDish(id: string): boolean {
  const dishes = getAllDishes()
  const filtered = dishes.filter((d) => d.id !== id)
  if (filtered.length === dishes.length) return false
  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8')
  return true
}

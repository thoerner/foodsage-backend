import axios from 'axios'

const BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.upcitemdb.com/prod/v1'
    : 'https://api.upcitemdb.com/prod/trial'

export async function upcLookup(upc) {
    const url = `${BASE_URL}/lookup?upc=${upc}`
    const response = await axios.get(url)
    return response.data
}



import React, { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/'

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)

      const response = await fetch(
        `${API_BASE_URL}suppliers/paginated?limit=1000&page=1`
      )

      const result = await response.json()

      if (result.status) {
        setSuppliers(result.data.data || [])
      }
    } catch (error) {
      console.log('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const filteredSuppliers = suppliers.filter((supplier) =>
    `${supplier.name} ${supplier.shop_name} ${supplier.contact} ${supplier.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Supplier List</h2>

        <input
          type="text"
          placeholder="Search supplier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />
      </div>

      {loading ? (
        <p>Loading suppliers...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Shop Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Email</th>
                <th className="p-3">Address</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="border-t">
                    <td className="p-3">{supplier.id}</td>
                    <td className="p-3">{supplier.name}</td>
                    <td className="p-3">{supplier.shop_name}</td>
                    <td className="p-3">{supplier.contact}</td>
                    <td className="p-3">{supplier.email}</td>
                    <td className="p-3">{supplier.address}</td>
                    <td className="p-3">{supplier.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center">
                    No suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SupplierList

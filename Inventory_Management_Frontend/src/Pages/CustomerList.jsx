
import React, { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/'

const CustomerList = () => {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchCustomers = async () => {
    try {
      setLoading(true)

      const response = await fetch(
        `${API_BASE_URL}customers/paginated?limit=1000&page=1`
      )

      const result = await response.json()

      if (result.status) {
        setCustomers(result.data.data || [])
      }
    } catch (error) {
      console.log('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.contact} ${customer.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Customer List</h2>

        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2"
        />
      </div>

      {loading ? (
        <p>Loading customers...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Email</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-t">
                    <td className="p-3">{customer.id}</td>
                    <td className="p-3">{customer.name}</td>
                    <td className="p-3">{customer.contact}</td>
                    <td className="p-3">{customer.email}</td>
                    <td className="p-3">{customer.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-4 text-center">
                    No customers found.
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

export default CustomerList

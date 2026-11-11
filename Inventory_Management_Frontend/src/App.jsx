import React from "react";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashBoardLayout from "./Pages/DashBoardLayout";
import Home from "./Pages/Home";
import Brand from "./Pages/Brand";
import Warehouse from "./Pages/Warehouse";
import Category from "./Pages/Category";
import Role from "./Pages/Role";
import Payment from "./Pages/Payment";
import Supplier from "./Pages/Supplier";
import Customer from "./Pages/Customer";
import User from "./Pages/User";
import ExpensesCategory from "./Pages/Expense_category";
import Expenses from "./Pages/Expense";
import Product from "./Pages/Product";
import Stocks from "./Pages/Stocks";
import StocksHistory from "./Pages/StocksHistory";
import RetailCustomer from "./Pages/RetailCustomer";
import Sell from "./Pages/Sell";
import Transactions from "./Pages/Transactions";
import SellItem from "./Pages/SellItem";
import Investment from "./Pages/Investment";
import SupplierList from "./Pages/SupplierList";
import CustomerList from "./Pages/CustomerList";

const route = createBrowserRouter([
  {
    path: "/",
    element: <DashBoardLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/brand",
        element: <Brand />,
      },
      {
        path: "/warehouse",
        element: <Warehouse />,
      },
      {
        path: "/category",
        element: <Category />,
      },
      {
        path: "/role",
        element: <Role />,
      },
      {
        path: "/payment",
        element: <Payment />,
      },
      {
        path: "/supplier",
        element: <Supplier />,
      },
      {
        path: "/customer",
        element: <Customer />,
      },
      {
        path: "/user",
        element: <User />,
      },
      {
        path: "/expensescategory",
        element: <ExpensesCategory />,
      },
      {
        path: "/expenses",
        element: <Expenses />,
      },
      {
        path: "/product",
        element: <Product />,
      },
      {
        path: "/stock",
        element: <Stocks />,
      },
      {
        path: "/stockshistory",
        element: <StocksHistory />,
      },
      {
        path: "/retailcustomer",
        element: <RetailCustomer />,
      },
      {
        path: "/sell",
        element: <Sell />,
      },
      {
        path: "/sellitem",
        element: <SellItem />,
      },
      {
        path: "/transactions",
        element: <Transactions />,
      },
      {
        path: "/investment",
        element: <Investment />,
      },
      {
        path: "/suppliers",
        element: <Supplier />,
      },
      {
        path: "/customers",
        element: <Customer />,
      },

    ],
  },
]);

const App = () => {
  return <RouterProvider router={route} />;
};

export default App;

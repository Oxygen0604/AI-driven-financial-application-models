import './App.scss';
import React,{ useState } from'react';
import{
  createBrowserRouter,
  RouterProvider,
  Navigate
} from "react-router-dom"
import useAuthStore from './store/authStore';
import ProtectedRoute from './component/ProtectedRoute/ProtectedRoute.tsx';
const Login=React.lazy(()=>import("./pages/login/login.tsx"));
const DocumentProcess=React.lazy(()=>import("./pages/documentProcess/documentProcess.tsx"));
const Register=React.lazy(()=>import("./pages/register/register.tsx"));
const Question=React.lazy(()=>import("./pages/question/question.tsx"));
const User=React.lazy(()=>import("./pages/user/user.tsx"));
const Forget=React.lazy(()=>import("./pages/forget/forget.tsx"));
const Home=React.lazy(()=>import("./pages/home/home.tsx"));
const Analyse=React.lazy(()=>import("./pages/analyse/analyse.tsx"));

function App() {
  const {isAuthenticated}=useAuthStore();

const router = createBrowserRouter([
  {
    path:"*",
    element:
    isAuthenticated?(
      <Navigate to="/home" replace/>
    ):(
      <Navigate to="/login" replace/>
    )
  },
  {
    path:"/login",
    element:<Login/>
  },
  {
    path:"/documentProcess",
    element:
    <ProtectedRoute>
      <DocumentProcess/>
    </ProtectedRoute>
  },
  {
    path:"/analyse",
    element:
    <ProtectedRoute>
      <Analyse/>
    </ProtectedRoute>
  },
  {
    path:"/register",
    element:<Register/>
  },
  {
    path:"/question",
    element:
    <ProtectedRoute>
      <Question/>
    </ProtectedRoute>
  },
  {
    path:"/user",
    element:
    <ProtectedRoute>
      <User/>
    </ProtectedRoute>
  },
  {
    path:"/forget",
    element:<Forget/>
  },
  {
    path:"/home",
    element:
    <ProtectedRoute>
      <Home/>
    </ProtectedRoute>
  }


])
  return (
    <div className="App">
      <React.Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </React.Suspense>
    </div>
  );
}

export default App;

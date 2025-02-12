import './App.scss';
import React,{ useState } from'react';
import{
  createBrowserRouter,
  RouterProvider,
  Navigate
} from "react-router-dom"
// import useAuthStore from './store/authStore';
const Login=React.lazy(()=>import("./pages/login/login.tsx"));
const DocumentProcess=React.lazy(()=>import("./pages/documentProcess/documentProcess.tsx"));
const Detection=React.lazy(()=>import("./pages/detection/detection.tsx"));
const Register=React.lazy(()=>import("./pages/register/register.tsx"));
const Question=React.lazy(()=>import("./pages/question/question.tsx"));
const User=React.lazy(()=>import("./pages/user/user.tsx"));

// const {isAuthenticated}=useAuthStore();

const router = createBrowserRouter([
  {
    path:"*",
    element:
    // isAuthenticated?(
    //   <Navigate to="/documentProcess" replace/>
    // ):(
      <Navigate to="/login" replace/>
    // )
  },
  {
    path:"/login",
    element:<Login/>
  },
  {
    path:"/documentProcess",
    element:<DocumentProcess/>
  },
  {
    path:"/detection",
    element:<Detection/>
  },
  {
    path:"/register",
    element:<Register/>
  },
  {
    path:"/question",
    element:<Question/>
  },
  {
    path:"/user",
    element:<User/>
  }


])

function App() {
  return (
    <div className="App">
      <React.Suspense fallback={<div>Loading...</div>}>
        <RouterProvider router={router} />
      </React.Suspense>
    </div>
  );
}

export default App;

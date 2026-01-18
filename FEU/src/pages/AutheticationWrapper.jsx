import React from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Spinner from "../components/Spinner/Spinner";

/**
 * Wrapper component for Authentication pages (Login, Register).
 * Provides a consistent background and centers the forms.
 */
const AutheticationWrapper = () => {
  const isLoading = useSelector((state) => state.commonState.isLoading);
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center">
      {/* Container for the Auth Forms */}
      <div className="w-full">
        <Outlet />
      </div>
      
      {/* Global Loading Spinner */}
      {isLoading && <Spinner />}
    </div>
  );
};

export default AutheticationWrapper;

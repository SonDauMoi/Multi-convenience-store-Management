import React, { useCallback } from "react";
import { FcGoogle } from "react-icons/fc";
import { API_BASE_URL } from "../../api/constant.js";
const GoogleSignIn = () => {
  const handleClick = useCallback(() => {
    window.location.href = API_BASE_URL + "/oauth2/authorization/google";
  }, []);

  return (
    <button
      onClick={handleClick}
      className="flex justify-center items-center border w-full rounded border-gray-600 h-[48px] hover:bg-slate-50"
    >
      <FcGoogle className="text-2xl" />
      <p className="px-2 text-gray-500">Tiếp tục với Google</p>
    </button>
  );
};

export default GoogleSignIn;

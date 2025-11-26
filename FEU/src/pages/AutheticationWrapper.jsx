import React from "react";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Spinner from "../components/Spinner/Spinner";
import { useWindowSize } from "react-use";
import { FiShoppingBag } from "react-icons/fi";

const AutheticationWrapper = () => {
  const { width } = useWindowSize();
  const isLoading = useSelector((state) => state.commonState.isLoading);
  return (
    <div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {width >= 1024 && (
          <div className="flex flex-col justify-center items-center lg:p-[30px] bg-gradient-to-br from-blue-50 to-blue-100">
            <FiShoppingBag className="text-blue-600 text-8xl mb-8" />
            <p className="text-center tracking-[0.2px] font-semibold text-xl leading-7 max-w-[540px] my-7 mx-auto text-gray-700">
              Trải nghiệm mua sắm thông minh – theo dõi đơn hàng, cùng ưu đãi và
              lịch sử giao dịch dễ dàng
            </p>
            <div className="text-6xl font-bold text-blue-600 mt-8">
              ConveniMart
            </div>
          </div>
        )}
        <div>
          <Outlet />
        </div>
        {isLoading && <Spinner />}
      </div>
    </div>
  );
};

export default AutheticationWrapper;

import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from "../../store/features/common";
import { fetchUserDetails } from "../../api/userInfo.js";
import {
  loadUserInfo,
  selectIsUserAdmin,
  selectUserInfo,
} from "../../store/features/user";
import { logoutAPI } from "../../api/authencation";

const Account = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userInfo = useSelector(selectUserInfo);
  const isUserAdmin = useSelector(selectIsUserAdmin);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // console.log("userInfo từ Redux:", userInfo);
  // console.log("isUserAdmin:", isUserAdmin);

  useEffect(() => {
    dispatch(setLoading(true));
    fetchUserDetails()
      .then((res) => {
        dispatch(loadUserInfo(res));
      })
      .catch(() => {})

      .finally(() => {
        dispatch(setLoading(false));
      });
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await logoutAPI();
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/v1/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      navigate("/v1/login");
    }
  };

  return (
    <div className="pt-12 lg:pb-1 sm:max-w-xl md:max-w-full px-5 md:px-12 lg:px-15">
      {isUserAdmin && (
        <div className="text-right">
          <Link to={"/admin"} className="text-lg text-blue-900 underline">
            Manage Admin
          </Link>
        </div>
      )}
      {userInfo?.email && (
        <>
          <div className="md:flex mt-4">
            <ul className="lex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0">
              <li>
                <NavLink
                  to="/account-details/profile"
                  className={({ isActive }) =>
                    [
                      isActive
                        ? "bg-black hover:bg-gray-400"
                        : "bg-gray-400 hover:bg-black",
                      "flex items-center px-4 py-3 text-white rounded-lg active w-full whitespace-nowrap",
                    ].join(" ")
                  }
                >
                  <svg
                    className="w-5 h-4 me-2 text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
                  </svg>
                  Account
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={"/account-details/orders"}
                  className={({ isActive }) =>
                    [
                      isActive
                        ? "bg-black hover:bg-gray-400"
                        : "bg-gray-400 hover:bg-black",
                      "flex items-center px-4 py-3 text-white rounded-lg active w-full whitespace-nowrap",
                    ].join(" ")
                  }
                >
                  <svg
                    className="w-4 h-4 me-2 inline-block align-middle"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13.5833 7.39473L13.5138 6.45768C13.4501 5.59928 12.7083 4.93421 11.8146 4.93421H9.99368M3.5 16.4167H2.45365C1.465 16.4167 0.683979 15.609 0.754417 14.6594L1.36283 6.45769C1.42651 5.59928 2.16831 4.93421 3.06207 4.93421H4.88298M4.88298 4.93421V3.29385C4.88298 1.93494 6.02705 0.833328 7.43833 0.833328C8.84961 0.833328 9.99368 1.93494 9.99368 3.29385V4.93421M4.88298 4.93421H9.99368M13.5833 12.75C13.5833 13.7625 12.7625 14.5833 11.75 14.5833C10.7375 14.5833 9.91667 13.7625 9.91667 12.75M8.08333 18.25H15.4167C16.4292 18.25 17.25 17.4292 17.25 16.4167V11.8333C17.25 10.8208 16.4292 9.99999 15.4167 9.99999H8.08333C7.07081 9.99999 6.25 10.8208 6.25 11.8333V16.4167C6.25 17.4292 7.07081 18.25 8.08333 18.25Z" />
                  </svg>
                  My Orders
                </NavLink>
              </li>
              <li>
                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="bg-gray-400 hover:bg-black flex items-center px-4 py-3 text-white rounded-lg active w-full whitespace-nowrap text-left"
                >
                  <svg
                    className="w-4 h-4 me-2 inline-block align-middle"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 7.5h-.423l-.452-1.09.3-.3a1.5 1.5 0 0 0 0-2.121L16.01 2.575a1.5 1.5 0 0 0-2.121 0l-.3.3-1.089-.452V2A1.5 1.5 0 0 0 11 .5H9A1.5 1.5 0 0 0 7.5 2v.423l-1.09.452-.3-.3a1.5 1.5 0 0 0-2.121 0L2.576 3.99a1.5 1.5 0 0 0 0 2.121l.3.3L2.423 7.5H2A1.5 1.5 0 0 0 .5 9v2A1.5 1.5 0 0 0 2 12.5h.423l.452 1.09-.3.3a1.5 1.5 0 0 0 0 2.121l1.415 1.413a1.5 1.5 0 0 0 2.121 0l.3-.3 1.09.452V18A1.5 1.5 0 0 0 9 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-.423l1.09-.452.3.3a1.5 1.5 0 0 0 2.121 0l1.415-1.414a1.5 1.5 0 0 0 0-2.121l-.3-.3.452-1.09H18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 18 7.5Zm-8 6a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z" />
                  </svg>
                  Logout
                </button>
              </li>
            </ul>
            <div className="px-4 w-full rounded-lg">
              <Outlet />
            </div>
          </div>
        </>
      )}
      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fadeIn">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-scaleIn">
            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-yellow-50 border-4 border-yellow-500 mb-4">
                <svg
                  className="w-12 h-12 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Confirm Logout
              </h3>

              {/* Message */}
              <div className="text-gray-600 text-center leading-relaxed">
                Are you sure you want to logout?
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 px-6 py-3 text-gray-700 bg-gray-100 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-6 py-3 text-white rounded-lg font-semibold transition-colors bg-yellow-600 hover:bg-yellow-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Account;

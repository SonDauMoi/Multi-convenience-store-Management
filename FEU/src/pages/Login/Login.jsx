import React, { useCallback, useEffect, useState } from "react";
import GitHubSignIn from "../../components/Button/GitHubSignIn.jsx";
import FacebookSignIn from "../../components/Button/FacebookSignIn.jsx";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLoading } from "../../store/features/common";
import { loginAPI } from "../../api/authencation.js";
import { getUserInfo } from "../../utils/jwt-helper";
import { Controller, useForm } from "react-hook-form";
import PasswordInput from "../../components/PasswordInput.jsx";
import Modal from "../../components/Modal";

const Login = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const verifiedSuccess = searchParams.get("verified") === "success";
  const [showToast, setShowToast] = useState(verifiedSuccess);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    const hasVerified = sessionStorage.getItem("verifiedSuccess") === "true";
    if (hasVerified) {
      setShowToast(true);
      sessionStorage.removeItem("verifiedSuccess");
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: { username: "", password: "" },
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = useCallback(
    async (data) => {
      dispatch(setLoading(true));
      try {
        const res = await loginAPI(data);
        if (res?.token && res?.refreshToken) {
          const userInfo = getUserInfo();
          if (userInfo?.role === "admin") navigate("/admin");
          else if (userInfo?.role === "manager") navigate("/manager");
          else navigate("/");
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        if (
          error.response?.status === 403 &&
          error.response?.data?.needsVerification
        ) {
          setModalState({
            isOpen: true,
            type: "warning",
            title: "Xác thực email",
            message:
              "Tài khoản chưa được xác thực. Chuyển đến trang đăng ký để nhận mã?",
            onConfirm: () => navigate("/v1/register"),
          });
          return;
        }
        setModalState({
          isOpen: true,
          type: "error",
          title: "Lỗi đăng nhập",
          message:
            error.response?.data?.message ||
            "Thông tin đăng nhập không chính xác",
        });
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch, navigate]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Modal
        {...modalState}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
      />

      {/* Verification Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-black text-white px-6 py-3 rounded-lg shadow-2xl animate-bounce">
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-bold">
            Account verified! Please login.
          </span>
        </div>
      )}

      <div className="max-w-[440px] w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Banner/Logo Section */}
        <div className="bg-black p-8 text-center">
          <img
            src="/S-store logo.jpg"
            alt="S-Store Logo"
            className="w-20 h-20 mx-auto rounded-xl object-cover border-2 border-white/20 shadow-inner mb-4"
          />
          <h1 className="text-2xl font-bold text-white tracking-tight uppercase">
            S-Store Portal
          </h1>
          <p className="text-gray-400 text-xs mt-1 font-medium tracking-widest uppercase">
            Convenience at your fingertips
          </p>
        </div>

        <div className="p-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black italic underline decoration-gray-200 underline-offset-8 decoration-4">
              Welcome!
            </h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className={`w-full h-[52px] px-4 rounded-xl border-2 bg-gray-50 outline-none transition-all focus:bg-white ${
                  errors.username
                    ? "border-red-500 ring-red-100"
                    : "border-gray-100 focus:border-black"
                }`}
                {...register("username", { required: "Username is required" })}
              />
              {errors.username && (
                <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                Password
              </label>
              <Controller
                name="password"
                control={control}
                rules={{ required: "Password is required" }}
                render={({ field }) => (
                  <PasswordInput
                    placeholder="••••••••"
                    error={errors.password}
                    innerRef={field.ref}
                    value={field.value}
                    onChange={field.onChange}
                    className="h-[52px] border-2 border-gray-100 rounded-xl bg-gray-50 focus-within:border-black focus-within:bg-white transition-all"
                  />
                )}
              />
              {errors.password && (
                <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1 uppercase">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                className="text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-tighter"
              >
                Forgot Security Key?
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-[52px] bg-black hover:bg-gray-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-black/10 active:scale-[0.98] mt-2 uppercase tracking-widest text-sm"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100"></span>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                Social Access
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <GitHubSignIn className="h-[48px] border-2 border-gray-100 rounded-xl hover:border-black transition-all" />
            <FacebookSignIn className="h-[48px] border-2 border-gray-100 rounded-xl hover:border-black transition-all" />
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <NavLink
                to="/v1/register"
                className="font-bold text-black hover:underline underline-offset-4"
              >
                Create One
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

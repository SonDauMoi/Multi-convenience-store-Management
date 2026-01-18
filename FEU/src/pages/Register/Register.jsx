import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useForm, Controller } from "react-hook-form";
import { NavLink } from "react-router-dom";
import { setLoading } from "../../store/features/common";
import { registerAPI } from "../../api/authencation.js";
import GitHubSignIn from "../../components/Button/GitHubSignIn.jsx";
import FacebookSignIn from "../../components/Button/FacebookSignIn.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";
import VerifyCode from "./VerifyCode.jsx";

const Register = () => {
  const dispatch = useDispatch();
  const [enableVerify, setEnableVerify] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
      phone: "",
    },
  });

  const onSubmit = useCallback(
    async (data) => {
      setApiError("");
      dispatch(setLoading(true));
      try {
        // BEU expects: { username, email, password, name, phone }
        const res = await registerAPI(data);
        if (
          res?.message ===
          "User created successfully. Please verify your email."
        ) {
          setEnableVerify(true);
        } else {
          throw new Error(res?.message || "Registration failed");
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Email or username already exists!";
        setApiError(errorMessage);
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  if (enableVerify) return <VerifyCode email={control._formValues.email} />;

  return (
    <div className="bg-widget flex items-center justify-center w-full py-10 px-4 lg:p-[110px]">
      <div className="max-w-[460px] w-full">
        <div className="flex flex-col gap-2.5 text-center">
          <h1 className="text-4xl font-bold">Create an account</h1>
          <p className="lg:max-w-[300px] m-auto">
            Create an account to start shopping with us.
          </p>
        </div>

        <form
          className="mt-5"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <div className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-bold text-[14px] text-gray-500">
                Username
              </label>
              <input
                type="text"
                placeholder="Username"
                className={`h-[48px] w-full border p-2 ${
                  errors.username ? "border-red-500" : "border-gray-400"
                }`}
                {...register("username", {
                  required: "Please enter a username",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters",
                  },
                })}
              />
              {errors.username && (
                <p className="text-red-500 text-sm">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-bold text-[14px] text-gray-500">
                Email
              </label>
              <input
                type="email"
                placeholder="Email address"
                className={`h-[48px] w-full border p-2 ${
                  errors.email ? "border-red-500" : "border-gray-400"
                }`}
                {...register("email", {
                  required: "Please enter an email address",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "Please enter a password",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                }}
                render={({ field }) => (
                  <PasswordInput
                    id="password"
                    placeholder="Password"
                    error={errors.password}
                    innerRef={field.ref}
                    isInvalid={errors.password}
                    value={field.value}
                    onChange={field.onChange}
                    errors={errors.password?.message}
                  />
                )}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-bold text-[14px] text-gray-500">
                Full name
              </label>
              <input
                type="text"
                placeholder="Full name"
                className={`h-[48px] w-full border p-2 ${
                  errors.name ? "border-red-500" : "border-gray-400"
                }`}
                {...register("name", {
                  required: "Please enter your full name",
                })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-[8px]">
              <label className="font-bold text-[14px] text-gray-500">
                Phone number
              </label>
              <input
                type="tel"
                placeholder="Phone number"
                className={`h-[48px] w-full border p-2 ${
                  errors.phone ? "border-red-500" : "border-gray-400"
                }`}
                {...register("phone", {
                  required: "Please enter your phone number",
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: "Invalid phone number",
                  },
                })}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 mt-4 mb-10 pt-12">
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
            >
              Sign up
            </button>
            {apiError && <p className="text-red-500 text-sm">{apiError}</p>}
          </div>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-sm text-gray-500 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
        <div className="space-y-3">
          <GitHubSignIn />
          <FacebookSignIn />
        </div>
        <div className="flex justify-center gap-2.5 leading-none pt-4">
          <p>Already have an account?</p>
          <NavLink
            to="/v1/login"
            className={({ isActive }) => (isActive ? "active-link" : "")}
          >
            Log in
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Register;

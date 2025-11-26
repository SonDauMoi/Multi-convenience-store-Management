import React from "react";
import store from "../../assets/images/store.png";

const ShopPages = () => {
  return (
    <>
      <div className=" py-10 px-5 md:px-12 lg:px-15 my-10">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">
          Cửa hàng của chúng tôi
        </h2>
        <div className="flex flex-wrap justify-center gap-6">
          {shops.map((shop, index) => (
            <a
              key={index}
              href={shop.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-104 bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition duration-300"
            >
              <div className="w-16 h-16 mx-auto mb-4">
                <img
                  src={store}
                  alt="store"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <p className="text-gray-800 text-base font-semibold">
                {shop.label}
              </p>
              <p className="text-gray-600 text-sm">{shop.address}</p>
              {shop.isNew && (
                <span className="inline-block mt-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  NEW
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </>
  );
};

export default ShopPages;

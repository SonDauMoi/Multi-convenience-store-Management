import React from "react";

const Footer = ({ content }) => {
  if (!content || !content.items) return null;
  return (
    <div className="relative mt-16 bg-gray-50 border-t border-gray-200">
      <div className="pt-12 mx-auto pb-10 sm:pb-10 lg:pb-1 sm:max-w-xl md:max-w-full px-5 md:px-12 lg:px-15">
        <div className="grid gap-16 row-gap-10 mb-8 lg:grid-cols-6">
          <div className="w-full md:max-w-xl lg:col-span-2 mx-auto text-center lg:text-left lg:mx-0">
            <a
              href="/"
              aria-label="Go home"
              title="ConveniMart"
              className="inline-flex items-center justify-center lg:justify-start text-3xl font-bold text-blue-600"
            >
              ConveniMart
            </a>
            <div className="mt-4 md:max-w-xl lg:max-w-sm mx-auto lg:mx-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                Cửa hàng tiện lợi trực tuyến cung cấp đa dạng sản phẩm từ thực
                phẩm, đồ uống đến đồ gia dụng và chăm sóc cá nhân.
              </p>
              <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                Cam kết chất lượng, giá cả hợp lý, giao hàng nhanh chóng trong
                khu vực.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5 row-gap-8 lg:col-span-4 md:grid-cols-4">
            {content.items.map((item, idx) => (
              <div key={idx}>
                <p className="font-semibold tracking-wide text-black">
                  {item.title}
                </p>
                <ul className="mt-2 space-y-2">
                  {item.list &&
                    item.list.map((listItem, lidx) => (
                      <li key={lidx}>
                        <a
                          href={listItem.path || "#"}
                          className="transition-colors duration-300 text-gray-700 hover:text-black"
                        >
                          {listItem.label}
                        </a>
                      </li>
                    ))}
                  {item.description && (
                    <li className="text-gray-700 text-sm">
                      {item.description}
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between pt-5 pb-10 border-t border-gray-200 sm:flex-row">
          <p className="text-sm text-black">{content?.copyright}</p>
          <div className="flex items-center mt-4 space-x-4 sm:mt-0">
            <span className="text-sm text-gray-600">Hỗ trợ thanh toán:</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
              VNPay
            </span>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded text-xs font-medium">
              MoMo
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
              Stripe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;

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
              title="S-Store"
              className="inline-flex items-center justify-center lg:justify-start gap-3"
            >
              <img
                src="/S-store logo.jpg"
                alt="S-Store Logo"
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <span className="text-3xl font-bold text-gray-900">S-Store</span>
            </a>
            <div className="mt-4 md:max-w-xl lg:max-w-sm mx-auto lg:mx-0">
              <p className="text-sm text-gray-700 leading-relaxed">
                Multi-location convenience store chain providing quality
                products from food, beverages to household items.
              </p>
              <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                Committed to quality, reasonable prices, and fast delivery in
                the area.
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
            <span className="text-sm text-gray-600">Payment Support:</span>
            <span className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium shadow-sm">
              PayPal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;

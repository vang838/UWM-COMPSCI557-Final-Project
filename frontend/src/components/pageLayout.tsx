import React from "react";

const PageLayout = ({ children, title, navigation }) => {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {navigation}
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
        {children}
      </div>
    </main>
  );
};

export default PageLayout;
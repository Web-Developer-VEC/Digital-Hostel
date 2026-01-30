// src/components/DynamicTitle.js
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet";

const titleMap = {
  "/": "Hostel",
};

export default function DynamicTitle() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Sort paths by length to avoid early match with '/'
  const sortedPaths = Object.keys(titleMap).sort((a, b) => b.length - a.length);
  const matchedKey = sortedPaths.find((key) => currentPath.startsWith(key));
  const pageTitle = titleMap[matchedKey] || "VEC";

  return (
    <Helmet>
      <title>{pageTitle}</title>
    </Helmet>
  );
}
import Swal from "sweetalert2";

const showSweetAlert = (title, text, icon = "info", options = "OK") => {
  const extraOptions = typeof options === "string" ? { confirmButtonText: options } : options || {};

  Swal.fire({
    title,
    text,
    icon,
    confirmButtonText: extraOptions.confirmButtonText || "OK",
    ...extraOptions,
  });
};

export default showSweetAlert;
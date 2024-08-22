import { RingLoader } from "react-spinners";

const PageLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <RingLoader color="#fff" size={150} />
    </div>
  );
};
export default PageLoader;

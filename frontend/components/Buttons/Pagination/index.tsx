import RippleButton from "../RippleButton";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  handlePrevPage: () => void;
  handleNextPage: () => void;
  handlePageClick: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  handlePrevPage,
  handleNextPage,
  handlePageClick,
}) => {
  return (
    <>
      <div className="flex justify-center mt-16 gap-x-4">
        <RippleButton
          className="mr-2"
          text="Previous"
          onClick={handlePrevPage}
          active={currentPage > 1}
        />
        {Array.from({ length: totalPages }, (_, index) => (
          <RippleButton
            key={index + 1}
            text={`${index + 1}`}
            onClick={() => handlePageClick(index + 1)}
            active={currentPage === index + 1}
          />
        ))}
        <RippleButton
          text="Next"
          onClick={handleNextPage}
          active={currentPage < totalPages}
        />
      </div>
      <p className="text-center mt-6 text-white">
        Page {currentPage} of {totalPages}
      </p>
    </>
  );
};

export default Pagination;

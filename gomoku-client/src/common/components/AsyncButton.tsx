import React, { useState } from "react";
// import './AsyncButton.module.scss';

type AsyncButtonProps = {
  children: React.ReactNode;
  onClick: () => Promise<void>;
  className?: string;
};

const AsyncButton = ({
  children,
  onClick,
  className = "",
}: AsyncButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`async-button ${className} ${isLoading ? "loading" : ""}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};

export default AsyncButton;

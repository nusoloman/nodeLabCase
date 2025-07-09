import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`bg-gray-800 rounded-2xl shadow-xl overflow-hidden transform transition-all hover:shadow-2xl duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-gradient-to-r from-purple-600 to-blue-500 p-8 text-white text-center ${className}`}
    >
      {children}
    </div>
  );
};

const CardContent: React.FC<CardContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`p-8 ${className}`}>{children}</div>;
};

const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`px-8 py-4 bg-gray-700/50 border-t border-gray-600 ${className}`}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardContent, CardFooter };

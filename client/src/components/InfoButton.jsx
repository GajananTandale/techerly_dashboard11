import React from "react";
import { Button } from "react-bootstrap";

function InfoButton({ children, ...props }) {
  return (
    <Button className="info-button" variant="light" {...props}>
      {children}
      <i className="fas fa-question" />
    </Button>
  );
}

export default InfoButton;

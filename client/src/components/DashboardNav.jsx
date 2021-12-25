import React from "react";
import { Nav } from "react-bootstrap";

function DashboardNav({ children, ...props }) {
  return (
    <Nav {...props} variant="primary">
      <Nav.Item className="ml-auto" as="li">
        <Nav.Link>
          <div className="btn btn-primary">New</div>
        </Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link>Courses</Nav.Link>
      </Nav.Item>
      <Nav.Item as="li">
        <Nav.Link>Videos</Nav.Link>
      </Nav.Item>
    </Nav>
  );
}

export default DashboardNav;

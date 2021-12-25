import React from "react";

const Footer = () => {
  const contacts = [
    {
      name: "Pankaj Chavan",
      role: "Research Scholar",
      link: "https://www.pankajchavan.me/",
      rel: "noopener",
      target: "_blank",
      mail: "pankajchavan@iitb.ac.in",
      cc: "rmitra@iitb.ac.in,localhoax0@gmail.com",
    },
    {
      name: "Ritayan Mitra",
      role: "Faculty",
      link: "https://sites.google.com/site/mitrares001/",
      rel: "noopener",
      target: "_blank",
      mail: "rmitra@iitb.ac.in",
      cc: "pankajchavan@iitb.ac.in,localhoax0@gmail.com",
    },
    {
      name: "Bhupender Singh Maan",
      role: "Software Developer",
      link: "https://www.linkedin.com/in/bhupender-singh-maan",
      rel: "author",
      target: "_blank",
      mail: "localhoax0@gmail.com",
      cc: "pankajchavan@iitb.ac.in,rmitra@iitb.ac.in",
    },
  ];

  return (
    <footer>
      <div className="container">
        <div className="row justify-content-center justify-content-md-between">
          <div className="col-xl-3 col-lg-4 col-md-3 col-sm-5 text-center">
            <a href="http://www.et.iitb.ac.in/" target="_blank" rel="noopener noreferrer external">
              <img src="/et-logo.png" alt="Interdisciplinary Programme in Education Technology." className="img-fluid img-logo" />
            </a>
          </div>
          <div className="col-xl-5 col-lg-6 col-md-7 mb-3 mb-md-0">
            <div className="d-flex h-100 justify-content-center">
              <div className="contact-us text-sm-left text-justify">
                <div className="text-left mt-4 mt-sm-0">Contact us</div>
                <table className="table table-borderless text-light mb-0">
                  <thead>
                    <tr>
                      <td className="p-0"> </td>
                      <td className="p-0"> </td>
                      <td className="p-0"> </td>
                      <td className="p-0"> </td>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact, key) => {
                      return (
                        <tr key={"contact-" + key}>
                          <td className="p-0">
                            <a className="footer-link" href={"mailto:" + contact.mail + "?cc=" + contact.cc + "&subject=Tcherly Contact"}>
                              <i className="fas fa-envelope"></i>
                            </a>
                          </td>
                          <td className="px-2 py-0">
                            <a className="footer-link" href={contact.link} target={contact.target} rel={`${contact.rel} no`}>
                              {contact.name}
                            </a>
                            &nbsp;
                          </td>
                          <td className="p-0">{contact.role}</td>
                          <td className="p-0"> </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright mt-3">
          <div className="mx-auto">
            Copyright © 2020-{new Date().getFullYear()}{" "}
            <a href="http://www.et.iitb.ac.in/" target="_blank" rel="author noreferrer external" className="footer-link">
              IDP-ET, IIT Bombay
            </a>
            {". "}
            All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

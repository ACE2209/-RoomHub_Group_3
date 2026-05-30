import React from "react";
import {
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
} from "lucide-react";

const Footer = () => {
    return (
        <footer className="bg-light border-top mt-5">
            <div className="container py-5">
                <div className="row g-4">
                    {/* Brand */}
                    <div className="col-lg-4">
                        <div className="d-flex align-items-center mb-3">
                            <img
                                src="/image/logo.png"
                                alt="RoomHub Logo"
                                style={{
                                    width: "150px",
                                    height: "150px",
                                    objectFit: "contain",
                                }}
                            />
                        </div>

                        <p className="text-muted">
                            The ultimate online boarding
                            house management solution
                            designed for modern landlords.
                            We streamline tenant
                            management, payment tracking,
                            and property maintenance in one
                            secure platform.
                        </p>

                        <div className="d-flex gap-3">
                            <a
                                href="/"
                                className="text-dark"
                            >
                                <Facebook size={22} />
                            </a>

                            <a
                                href="/"
                                className="text-dark"
                            >
                                <Twitter size={22} />
                            </a>

                            <a
                                href="/"
                                className="text-dark"
                            >
                                <Linkedin size={22} />
                            </a>

                            <a
                                href="/"
                                className="text-dark"
                            >
                                <Instagram size={22} />
                            </a>
                        </div>
                    </div>

                    {/* Company */}
                    <div className="col-md-4 col-lg-2">
                        <h6 className="fw-bold mb-3">
                            Company
                        </h6>

                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <a
                                    href="/"
                                    className="text-decoration-none text-muted"
                                >
                                    About Us
                                </a>
                            </li>

                            <li className="mb-2">
                                <a
                                    href="/"
                                    className="text-decoration-none text-muted"
                                >
                                    Careers
                                </a>
                            </li>

                            <li>
                                <a
                                    href="/"
                                    className="text-decoration-none text-muted"
                                >
                                    Blog
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="col-md-4 col-lg-3">
                        <h6 className="fw-bold mb-3">
                            Support
                        </h6>

                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <a
                                    href="/"
                                    className="text-decoration-none text-muted"
                                >
                                    Contact Support
                                </a>
                            </li>

                            <li>
                                <a
                                    href="/"
                                    className="text-decoration-none text-muted"
                                >
                                    Help Center
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="col-md-4 col-lg-3">
                        <h6 className="fw-bold mb-3">
                            Legal
                        </h6>

                        <ul className="list-unstyled">
                            <li className="mb-2">
                                <a
                                    href="/"
                                    className="text-decoration-none text-muted"
                                >
                                    Privacy Policy
                                </a>
                            </li>

                            <li>
                                <a
                                    href="/"
                                    className="text-decoration-none text-muted"
                                >
                                    Terms of Service
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <hr className="my-4" />

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                    <p className="mb-2 mb-md-0 text-muted">
                        © 2026 RoomHub.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
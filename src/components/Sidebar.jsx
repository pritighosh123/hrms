import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { employeeService } from "../services/api";

const Sidebar = () => {
  const { role, employeeId } = useAuth();
  const isAdminOrHr = role === "Admin" || role === "HR";
  const [hasSubordinates, setHasSubordinates] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    employeeService.getAll()
      .then(({ data }) => {
        setHasSubordinates(data.some(
          (employee) => Number(employee.reportsToEmployeeId) === Number(employeeId)
        ));
      })
      .catch(() => setHasSubordinates(false));
  }, [employeeId]);

  const canManageLeave = isAdminOrHr || hasSubordinates;

  const navItemClass = ({ isActive }) =>
    `nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 ${
      isActive
        ? "active bg-primary text-white shadow-sm"
        : "text-secondary hover-bg"
    }`;

  return (
    <div
      className="bg-white border-end p-3 d-flex flex-column"
      style={{ minWidth: "240px", minHeight: "calc(100vh - 56px)" }}
    >
      <h6 className="text-uppercase text-muted fw-bold px-3 small mb-3">
        Navigation
      </h6>

      <ul className="nav nav-pills flex-column gap-1 flex-grow-1">
        <li className="nav-item">
          <NavLink to="/dashboard" className={navItemClass}>
            <i className="bi bi-speedometer2 fs-5"></i>
            <span>Dashboard</span>
          </NavLink>
        </li>

        {isAdminOrHr && (
          <li className="nav-item">
            <NavLink to="/employees" className={navItemClass}>
              <i className="bi bi-people-fill fs-5"></i>
              <span>Employees</span>
            </NavLink>
          </li>
        )}

        <li className="nav-item">
          <NavLink to="/attendance" className={navItemClass}>
            <i className="bi bi-calendar-check-fill fs-5"></i>
            <span>Attendance</span>
          </NavLink>
        </li>
        {role !== "Admin" && (
          <li className="nav-item">
            <NavLink to="/apply-leave" className={navItemClass}>
              <i className="bi bi-calendar-plus-fill fs-5"></i>
              <span>Apply Leave</span>
            </NavLink>
          </li>
        )}
        {role !== "Admin" && (
          <li className="nav-item">
            <NavLink to="/my-leaves" className={navItemClass}>
              <i className="bi bi-clock-history fs-5"></i>
              <span>My Leaves</span>
            </NavLink>
          </li>
        )}
        {canManageLeave && (
          <li className="nav-item">
            <NavLink to="/leave-approvals" className={navItemClass}>
              <i className="bi bi-check-circle-fill fs-5"></i>
              <span>Leave Approvals</span>
            </NavLink>
          </li>
        )}
        {role === "Manager" && (
          <li className="nav-item">
            <NavLink to="/my-team" className={navItemClass}>
              <i className="bi bi-people-fill fs-5"></i>
              <span>My Team</span>
            </NavLink>
          </li>
        )}

        <hr className="my-2" />

        <li className="nav-item">
          <NavLink to="/change-password" className={navItemClass}>
            <i className="bi bi-shield-lock-fill fs-5"></i>
            <span>Change Password</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;

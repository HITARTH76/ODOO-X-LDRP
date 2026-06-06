-- Database creation
CREATE DATABASE IF NOT EXISTS vendorbridge;
USE vendorbridge;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('Procurement Officer', 'Vendor', 'Manager', 'Admin') NOT NULL,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors Table (additional details for Vendor users)
CREATE TABLE IF NOT EXISTS vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE,
  company_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  gst_number VARCHAR(15) UNIQUE NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  rating DECIMAL(3,2) DEFAULT 5.00,
  status ENUM('Pending', 'Active', 'Inactive') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- RFQs (Request for Quotations) Table
CREATE TABLE IF NOT EXISTS rfqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  quantity INT NOT NULL,
  deadline DATE NOT NULL,
  status ENUM('Draft', 'Active', 'Closed', 'Completed') DEFAULT 'Draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- RFQ Vendor Assignment Table
CREATE TABLE IF NOT EXISTS rfq_vendors (
  rfq_id INT NOT NULL,
  vendor_id INT NOT NULL,
  PRIMARY KEY (rfq_id, vendor_id),
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rfq_id INT NOT NULL,
  vendor_id INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  delivery_days INT NOT NULL,
  remarks TEXT,
  status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rfq_id) REFERENCES rfqs(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Approvals Table
CREATE TABLE IF NOT EXISTS approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quotation_id INT NOT NULL,
  approver_id INT NOT NULL,
  status ENUM('Approved', 'Rejected') NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  quotation_id INT NOT NULL,
  status ENUM('Draft', 'Sent', 'Accepted', 'Completed') DEFAULT 'Draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  purchase_order_id INT NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  status ENUM('Pending', 'Paid', 'Cancelled') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  image_url VARCHAR(255) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);


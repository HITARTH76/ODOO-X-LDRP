import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User, ShieldAlert, FileText, Phone, MapPin, Building, Camera, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login, register, forgotPassword } = useAuth();
  
  // View states: 'login' | 'register' | 'forgot'
  const [view, setView] = useState('login');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Wireframe Registration Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [role, setRole] = useState('Procurement Officer'); // default role

  // Vendor Specific Fields (shown only if role is Vendor in Signup)
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState('IT & Hardware');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const msg = 'Incorrect email or password';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all core credentials.');
      return;
    }

    if (role === 'Vendor') {
      if (!companyName || !gstNumber || !address) {
        setError('Please complete all vendor company profiles.');
        return;
      }
      if (gstNumber.length < 15) {
        setError('GST number must be at least 15 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: `${firstName} ${lastName}`,
        email,
        password,
        role,
        ...(role === 'Vendor' ? { companyName, category, gstNumber, phone, address } : { phone, address: country, category: additionalInfo })
      };
      await register(payload);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(res.message || 'Password reset instructions emailed.');
    } catch (err) {
      setError(err.message || 'Error occurred. Please verify your email.');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = (targetView) => {
    clearMessages();
    setError('');
    setSuccess('');
    setView(targetView);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">VendorBridge ERP</h1>
          <p className="auth-subtitle">
            {view === 'login' && 'Procurement & Vendor Management Portal'}
            {view === 'register' && 'Create a new ERP account'}
            {view === 'forgot' && 'Reset your account password'}
          </p>
        </div>

        {error && (
          <div className="card" style={{ backgroundColor: 'var(--error-light)', color: 'var(--error-text)', padding: '12px', border: '1px solid var(--error)', marginBottom: '16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="card" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success-text)', padding: '12px', border: '1px solid var(--success)', marginBottom: '16px', borderRadius: '6px', fontSize: '13px' }}>
            <span>{success}</span>
          </div>
        )}

        {view === 'login' && (
          <form onSubmit={handleLoginSubmit}>
            {/* Circular VB Logo Placeholder */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, boxShadow: '0 4px 12px rgba(66, 165, 245, 0.3)' }}>
                VB
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Username (Email)</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '38px', width: '100%' }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="form-label">Password</label>
                <span className="auth-toggle-link" style={{ fontSize: '12px' }} onClick={() => toggleView('forgot')}>Forgot Password?</span>
              </div>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px', width: '100%' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <div 
                  style={{ position: 'absolute', right: '12px', top: '14px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Sign In'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>
              Don't have an account?{' '}
              <span className="auth-toggle-link" onClick={() => toggleView('register')}>Sign Up</span>
            </p>
          </form>
        )}

        {view === 'register' && (
          <form onSubmit={handleRegisterSubmit}>
            {/* Circular VB Logo Placeholder */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 800, boxShadow: '0 4px 12px rgba(66, 165, 245, 0.3)' }}>
                VB
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Last Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    className="form-control"
                    style={{ paddingLeft: '38px', width: '100%' }}
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    required
                    minLength={10}
                    maxLength={10}
                  />
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Role (Admin, officer)</label>
                <select 
                  className="form-control" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                >
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Vendor">Vendor Partner</option>
                  <option value="Manager">Approving Manager</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Country</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                  <select
                    className="form-control"
                    style={{ paddingLeft: '38px', width: '100%', appearance: 'none' }}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={loading}
                    required
                  >
                    <option value="" disabled>Select a Country</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                    <option value="China">China</option>
                    <option value="Brazil">Brazil</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Mexico">Mexico</option>
                    <option value="Italy">Italy</option>
                    <option value="Spain">Spain</option>
                    <option value="Netherlands">Netherlands</option>
                    <option value="Singapore">Singapore</option>
                    <option value="United Arab Emirates">United Arab Emirates</option>
                    <option value="New Zealand">New Zealand</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Added Password Field to Match Authentication Requirement */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px', width: '100%' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <div 
                  style={{ position: 'absolute', right: '12px', top: '14px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Information ....</label>
              <textarea
                className="form-control"
                style={{ width: '100%', minHeight: '80px', padding: '12px' }}
                placeholder="Enter any additional details here..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Vendor Profile Creation Fields */}
            {role === 'Vendor' && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: 'var(--primary)' }}>Vendor Profile Information</h3>
                
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <div style={{ position: 'relative' }}>
                    <Building size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '38px', width: '100%' }}
                      placeholder="Global Hardware LLC"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      disabled={loading}
                      required={role === 'Vendor'}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      disabled={loading}
                    >
                      <option value="IT & Hardware">IT & Hardware</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Consulting Services">Consulting Services</option>
                      <option value="Logistics">Logistics</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <div style={{ position: 'relative' }}>
                      <FileText size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '38px', width: '100%' }}
                        placeholder="GSTIN12345678"
                        maxLength={15}
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                        disabled={loading}
                        required={role === 'Vendor'}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone removed here since it's now in main grid */}

                <div className="form-group">
                  <label className="form-label">Company Address</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                    <textarea
                      className="form-control"
                      style={{ paddingLeft: '38px', width: '100%', minHeight: '60px' }}
                      placeholder="Full Corporate Address..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      disabled={loading}
                      required={role === 'Vendor'}
                    />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '12px' }} disabled={loading}>
              {loading ? 'Creating Account...' : 'Register'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <span className="auth-toggle-link" onClick={() => toggleView('login')}>Sign In</span>
            </p>
          </form>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgotSubmit}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '13px', lineHeight: '1.4' }}>
              Provide your email address and we will dispatch a reset link to refresh your access password.
            </p>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '38px', width: '100%' }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '8px' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Recovery Link'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>
              Recall your details?{' '}
              <span className="auth-toggle-link" onClick={() => toggleView('login')}>Sign In</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

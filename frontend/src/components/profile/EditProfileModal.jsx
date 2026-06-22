import React, { useState, useRef, useEffect } from 'react'
import { X, Upload, User, Mail, FileText, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import './EditProfileModal.css'

export default function EditProfileModal({ isOpen, onClose, onSuccess }) {
  const { user, updateUser } = useAuth()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: ''
  })
  
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [hasExistingAvatar, setHasExistingAvatar] = useState(false)
  
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState(null)
  
  const fileInputRef = useRef(null)

  // Fetch latest profile details when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchProfile = async () => {
        setIsFetching(true)
        setFieldErrors({})
        setGeneralError(null)
        try {
          const token = localStorage.getItem('accessToken')
          const response = await fetch('http://127.0.0.1:8000/api/users/profile/', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (response.ok) {
            const data = await response.json()
            setFormData({
              username: data.username || '',
              email: data.email || '',
              bio: data.bio || ''
            })
            if (data.avatar) {
              setAvatarPreview(data.avatar.startsWith('http') ? data.avatar : `http://127.0.0.1:8000${data.avatar}`)
              setHasExistingAvatar(true)
            } else {
              setAvatarPreview(null)
              setHasExistingAvatar(false)
            }
          } else {
            // Fallback to local auth context if fetch fails
            if (user) {
              setFormData({
                username: user.username || '',
                email: user.email || '',
                bio: user.bio || ''
              })
              setAvatarPreview(user.avatar ? `http://127.0.0.1:8000${user.avatar}` : null)
              setHasExistingAvatar(!!user.avatar)
            }
          }
        } catch (err) {
          console.error("Failed to fetch profile details", err)
          if (user) {
            setFormData({
              username: user.username || '',
              email: user.email || '',
              bio: user.bio || ''
            })
            setAvatarPreview(user.avatar ? `http://127.0.0.1:8000${user.avatar}` : null)
            setHasExistingAvatar(!!user.avatar)
          }
        } finally {
          setIsFetching(false)
        }
      }

      fetchProfile()
      setAvatarFile(null)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setFieldErrors(prev => ({ ...prev, avatar: '' }))
    setGeneralError(null)

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, avatar: 'Image size cannot exceed 5MB.' }))
      return
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const fileExt = file.name.split('.').pop().toLowerCase()
    const validExts = ['jpg', 'jpeg', 'png', 'webp']

    if (!validTypes.includes(file.type) && !validExts.includes(fileExt)) {
      setFieldErrors(prev => ({ ...prev, avatar: 'Only JPG, JPEG, PNG and WEBP images are allowed.' }))
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setHasExistingAvatar(false)
    setFieldErrors(prev => ({ ...prev, avatar: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setFieldErrors({})
    setGeneralError(null)

    // Local Validation
    let errors = {}
    if (!formData.username.trim()) {
      errors.username = 'Username is required.'
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.'
    }
    if (formData.bio && formData.bio.length > 150) {
      errors.bio = 'Bio cannot exceed 150 characters.'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setIsLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const submitData = new FormData()
      submitData.append('username', formData.username.trim())
      submitData.append('email', formData.email.trim())
      submitData.append('bio', formData.bio)
      
      if (avatarFile) {
        submitData.append('avatar', avatarFile)
      } else if (!avatarPreview && hasExistingAvatar) {
        // If they had an avatar and deleted it, send an empty string to clear it
        submitData.append('avatar', '')
      }

      const response = await fetch('http://127.0.0.1:8000/api/users/profile/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 400) {
          // Parse Django/DRF validation error dictionary
          const parsedErrors = {}
          Object.keys(data).forEach((key) => {
            // Handle profile nested errors e.g. profile: { bio: [...] } or profile.bio
            if (key === 'profile') {
              if (data.profile.bio) {
                parsedErrors.bio = Array.isArray(data.profile.bio) ? data.profile.bio.join(' ') : data.profile.bio
              }
              if (data.profile.avatar) {
                parsedErrors.avatar = Array.isArray(data.profile.avatar) ? data.profile.avatar.join(' ') : data.profile.avatar
              }
            } else {
              parsedErrors[key] = Array.isArray(data[key]) ? data[key].join(' ') : data[key]
            }
          })
          setFieldErrors(parsedErrors)
        } else {
          throw new Error(data.detail || 'Failed to update profile.')
        }
      } else {
        // Success
        updateUser(data)
        if (onSuccess) {
          onSuccess('Profile updated successfully!')
        }
        onClose()
      }

    } catch (err) {
      setGeneralError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const initials = formData.username?.[0]?.toUpperCase() || '?'

  return (
    <div className="ep-modal-overlay" onClick={onClose}>
      <div className="ep-modal-content" onClick={e => e.stopPropagation()}>
        
        <div className="ep-modal-header">
          <h2 className="ep-modal-title">Edit Profile</h2>
          <button className="ep-close-btn" onClick={onClose} disabled={isLoading}>
            <X size={20} />
          </button>
        </div>

        {isFetching ? (
          <div className="ep-loading-state">
            <Loader2 size={36} className="ep-spinner animate-spin" />
            <p>Loading profile details...</p>
          </div>
        ) : (
          <form className="ep-form" onSubmit={handleSubmit}>
            
            {/* Avatar Section */}
            <div className="ep-avatar-section">
              <div className="ep-avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="ep-avatar-img" />
                ) : (
                  <div className="ep-avatar-placeholder">
                    {initials}
                  </div>
                )}
                
                <div className="ep-avatar-actions">
                  <button 
                    type="button" 
                    className="ep-btn-upload" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload size={14} /> Upload Image
                  </button>
                  {avatarPreview && (
                    <button 
                      type="button" 
                      className="ep-btn-remove" 
                      onClick={removeAvatar}
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="ep-file-input" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleFileChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <p className="ep-avatar-hint">Allowed formats: JPG, JPEG, PNG, WEBP. Max size: 5MB.</p>
              {fieldErrors.avatar && (
                <div className="ep-field-error">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.avatar}</span>
                </div>
              )}
            </div>

            {/* General Error Message */}
            {generalError && (
              <div className="ep-general-error">
                <AlertCircle size={14} />
                <span>{generalError}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="ep-field-group">
              <label className="ep-label">
                <User size={12} /> Username
              </label>
              <input 
                type="text" 
                name="username" 
                className={`ep-input ${fieldErrors.username ? 'ep-input--error' : ''}`}
                value={formData.username} 
                onChange={handleInputChange} 
                disabled={isLoading}
                placeholder="Username"
                required 
              />
              {fieldErrors.username && (
                <div className="ep-field-error">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.username}</span>
                </div>
              )}
            </div>

            <div className="ep-field-group">
              <label className="ep-label">
                <Mail size={12} /> Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                className={`ep-input ${fieldErrors.email ? 'ep-input--error' : ''}`}
                value={formData.email} 
                onChange={handleInputChange} 
                disabled={isLoading}
                placeholder="Email Address"
                required 
              />
              {fieldErrors.email && (
                <div className="ep-field-error">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.email}</span>
                </div>
              )}
            </div>

            <div className="ep-field-group">
              <label className="ep-label">
                <FileText size={12} /> Bio
              </label>
              <textarea 
                name="bio" 
                className={`ep-textarea ${fieldErrors.bio ? 'ep-input--error' : ''}`}
                value={formData.bio} 
                onChange={handleInputChange} 
                disabled={isLoading}
                placeholder="Tell us about yourself..."
                maxLength={150}
              />
              <div className="ep-char-count">
                {formData.bio ? formData.bio.length : 0}/150
              </div>
              {fieldErrors.bio && (
                <div className="ep-field-error">
                  <AlertCircle size={12} />
                  <span>{fieldErrors.bio}</span>
                </div>
              )}
            </div>

            <div className="ep-modal-footer">
              <button 
                type="button" 
                className="ep-btn-cancel" 
                onClick={onClose} 
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="ep-btn-save" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="ep-btn-spinner animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  )
}

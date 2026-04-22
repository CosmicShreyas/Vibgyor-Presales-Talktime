import React, { useState } from 'react'
import { Upload, X, AlertTriangle, CheckCircle } from 'lucide-react'
import NotificationModal from './NotificationModal'

const BrandPartnerCsvImportModal = ({ isOpen, onClose, onImport }) => {
  const [csvFile, setCsvFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [showValidation, setShowValidation] = useState(false)
  const [importing, setImporting] = useState(false)
  const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' })

  if (!isOpen) return null

  const validatePhone = (phone) => {
    if (!phone) return { valid: true } // Optional for phone 2
    const cleaned = phone.replace(/\D/g, '')
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return { valid: false, message: 'Invalid 10-digit mobile number' }
    }
    return { valid: true }
  }

  const validateEmail = (email) => {
    if (!email) return { valid: false, message: 'Email is required' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, message: 'Invalid email format' }
    }
    return { valid: true }
  }

  const validateIFSC = (ifsc) => {
    if (!ifsc) return { valid: false, message: 'IFSC code is required' }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(ifsc)) {
      return { valid: false, message: 'Invalid IFSC format' }
    }
    return { valid: true }
  }

  const validatePAN = (pan) => {
    if (!pan) return { valid: false, message: 'PAN is required' }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(pan)) {
      return { valid: false, message: 'Invalid PAN format' }
    }
    return { valid: true }
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const data = []
    const errors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      const partner = {
        rowIndex: i,
        partnerName: row['Partner Name'] || '',
        nickName: row['Nick Name'] || '',
        contactPerson1: row['Contact Person 1'] || '',
        phoneNo1: row['Phone No 1'] || '',
        contactPerson2: row['Contact Person 2'] || '',
        phoneNo2: row['Phone No 2'] || '',
        email: row['Email'] || '',
        password: row['Password'] || '',
        address: row['Address'] || '',
        accountHolderName: row['Account Holder Name'] || '',
        accountNumber: row['Account Number'] || '',
        bankName: row['Bank Name'] || '',
        ifscCode: row['IFSC Code'] || '',
        pan: row['PAN'] || '',
        remarks: row['Remarks'] || '',
        paymentTerms: row['Payment Terms'] || ''
      }

      // Validate
      const validations = {
        partnerName: partner.partnerName ? { valid: true } : { valid: false, message: 'Partner name is required' },
        contactPerson1: partner.contactPerson1 ? { valid: true } : { valid: false, message: 'Contact person 1 is required' },
        phoneNo1: partner.phoneNo1 ? validatePhone(partner.phoneNo1) : { valid: false, message: 'Phone number 1 is required' },
        phoneNo2: validatePhone(partner.phoneNo2),
        email: validateEmail(partner.email),
        password: partner.password && partner.password.length >= 6 ? { valid: true } : { valid: false, message: 'Password must be at least 6 characters' },
        address: partner.address ? { valid: true } : { valid: false, message: 'Address is required' },
        accountHolderName: partner.accountHolderName ? { valid: true } : { valid: false, message: 'Account holder name is required' },
        accountNumber: partner.accountNumber ? { valid: true } : { valid: false, message: 'Account number is required' },
        bankName: partner.bankName ? { valid: true } : { valid: false, message: 'Bank name is required' },
        ifscCode: validateIFSC(partner.ifscCode),
        pan: validatePAN(partner.pan)
      }

      const hasErrors = Object.values(validations).some(v => !v.valid)
      
      if (hasErrors) {
        errors.push({
          rowIndex: i,
          partner,
          errors: Object.entries(validations)
            .filter(([_, v]) => !v.valid)
            .map(([field, v]) => ({ field, message: v.message }))
        })
      }

      data.push(partner)
    }

    return { data, errors }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setCsvFile(file)
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const text = event.target.result
      const { data, errors } = parseCSV(text)
      
      setParsedData(data)
      setValidationErrors(errors)
      
      if (errors.length > 0) {
        setShowValidation(true)
      }
    }
    
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validPartners = parsedData.filter(partner => 
      !validationErrors.some(e => e.rowIndex === partner.rowIndex)
    )

    if (validPartners.length === 0) {
      setNotification({
        isOpen: true,
        title: 'No Valid Data',
        message: 'No valid brand partners to import. Please fix the validation errors.',
        type: 'warning'
      })
      return
    }

    setImporting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/brand-partners/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ partners: validPartners })
      })

      const result = await response.json()

      if (response.ok) {
        const successMessage = result.failed > 0 
          ? `Successfully imported ${result.imported} brand partner(s). ${result.failed} failed (likely duplicates).`
          : `Successfully imported ${result.imported} brand partner(s).`
        
        setNotification({
          isOpen: true,
          title: 'Import Complete',
          message: successMessage,
          type: result.failed > 0 ? 'warning' : 'success'
        })
        
        onImport()
        
        // Auto-close modal after showing notification
        setTimeout(() => {
          handleClose()
        }, 2500)
      } else {
        setNotification({
          isOpen: true,
          title: 'Import Failed',
          message: result.message || 'Failed to import brand partners.',
          type: 'error'
        })
      }
    } catch (error) {
      console.error('Error importing brand partners:', error)
      setNotification({
        isOpen: true,
        title: 'Import Failed',
        message: 'Failed to import brand partners. Please try again.',
        type: 'error'
      })
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setCsvFile(null)
    setParsedData([])
    setValidationErrors([])
    setShowValidation(false)
    setNotification({ isOpen: false, title: '', message: '', type: 'success' })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Brand Partners from CSV
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {!csvFile ? (
            <div>
              <label htmlFor="csv-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gray-50 dark:bg-gray-700/50">
                <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  CSV files only
                </span>
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  Expected CSV Format:
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-mono break-all">
                  Partner Name, Nick Name, Contact Person 1, Phone No 1, Contact Person 2, Phone No 2, Email, Password, Address, Account Holder Name, Account Number, Bank Name, IFSC Code, PAN, Remarks, Payment Terms
                </p>
              </div>
            </div>
          ) : showValidation && validationErrors.length > 0 ? (
            <div>
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Validation Issues Found
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      {validationErrors.length} brand partner(s) have validation errors. Only valid entries will be imported.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                {validationErrors.map((error) => (
                  <div key={error.rowIndex} className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Row {error.rowIndex}: {error.partner.partnerName || 'Unnamed'} ({error.partner.email})
                    </p>
                    <div className="space-y-1">
                      {error.errors.map((err, idx) => (
                        <div key={idx} className="flex items-center text-xs text-red-700 dark:text-red-300">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {err.field}: {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {parsedData.length - validationErrors.length} valid brand partner(s) ready to import
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {parsedData.length} Brand Partner(s) Ready to Import
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                All entries are valid and ready to be imported
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {csvFile && (
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || parsedData.length === validationErrors.length}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {importing ? 'Importing...' : `Import ${parsedData.length - validationErrors.length} Partner(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        title={notification.title}
        message={notification.message}
        type={notification.type}
      />
    </div>
  )
}

export default BrandPartnerCsvImportModal

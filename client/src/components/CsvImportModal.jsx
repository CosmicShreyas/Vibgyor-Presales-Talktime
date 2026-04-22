import React, { useState } from 'react'
import { Upload, X, AlertTriangle, CheckCircle, Edit2, Save } from 'lucide-react'

const CsvImportModal = ({ isOpen, onClose, onImport, users = [] }) => {
  const [csvFile, setCsvFile] = useState(null)
  const [parsedData, setParsedData] = useState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [duplicateErrors, setDuplicateErrors] = useState([])
  const [showValidation, setShowValidation] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [selectedLeads, setSelectedLeads] = useState(new Set()) // Track selected leads
  const [checkingDuplicates, setCheckingDuplicates] = useState(false)

  if (!isOpen) return null

  const validatePhoneNumber = (phone) => {
    if (!phone) return { valid: false, message: 'Phone number is required' }
    
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.length < 10) {
      return { valid: false, message: `Too short (${cleaned.length} digits)` }
    } else if (cleaned.length > 11) {
      return { valid: false, message: `Too long (${cleaned.length} digits)` }
    } else if (cleaned.length === 11) {
      // Check if it starts with 080 (valid landline)
      if (cleaned.startsWith('080')) {
        return { valid: true, isLandline: true }
      } else {
        return { valid: false, message: `Invalid 11-digit number (must start with 080)` }
      }
    }
    
    return { valid: true }
  }

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) return []

    const headers = lines[0].split(',').map(h => h.trim())
    const data = []
    const errors = []
    const phoneNumbersInCSV = new Map() // Track phone numbers within CSV

    // Helper function to convert scientific notation to regular number
    const parsePhoneNumber = (value) => {
      if (!value) return ''
      
      // Check if it's in scientific notation (e.g., 9.71525E+11)
      if (value.includes('E') || value.includes('e')) {
        try {
          // Convert to number and then to string to get full digits
          const num = parseFloat(value)
          // Convert to string without scientific notation
          return num.toFixed(0)
        } catch (e) {
          return value
        }
      }
      
      return value
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const row = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })

      // Map CSV fields to our lead structure
      const lead = {
        rowIndex: i,
        firstName: row['First Name'] || '',
        lastName: row['Last Name'] || '',
        name: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
        phone: parsePhoneNumber(row['Phone Number'] || ''),
        alternatePhone: parsePhoneNumber(row['Alternate Phone Number'] || ''),
        email: row['Email'] || '',
        company: row['Project Name'] || '',
        tags: row['Tags'] || '',
        assignTo: row['Assign To'] || row['Assigned To'] || '',
        leadCreatedDate: row['Lead Created Date'] || '',
        address: row['Address 2'] || '',
        city: row['City'] || '',
        state: row['State'] || '',
        description: row['Description'] || row['PR Name'] || '',
        source: row['Source'] || '',
        budget: row['Budget'] || '',
        leadStatus: row['Lead Status'] || 'pending',
        status: normalizeStatus(row['Lead Status'] || 'pending'),
        priority: 'medium',
        notes: ''
      }

      // Check for duplicates within CSV
      const cleanedPhone = lead.phone.replace(/\D/g, '')
      const cleanedAltPhone = lead.alternatePhone ? lead.alternatePhone.replace(/\D/g, '') : ''
      
      if (cleanedPhone) {
        if (phoneNumbersInCSV.has(cleanedPhone)) {
          lead.isDuplicateInCSV = true
          lead.duplicateCSVRow = phoneNumbersInCSV.get(cleanedPhone)
        } else {
          phoneNumbersInCSV.set(cleanedPhone, i)
        }
      }
      
      if (cleanedAltPhone) {
        if (phoneNumbersInCSV.has(cleanedAltPhone)) {
          lead.isDuplicateAltInCSV = true
          lead.duplicateAltCSVRow = phoneNumbersInCSV.get(cleanedAltPhone)
        } else {
          phoneNumbersInCSV.set(cleanedAltPhone, i)
        }
      }

      // Validate phone numbers
      const phoneValidation = validatePhoneNumber(lead.phone)
      const altPhoneValidation = lead.alternatePhone ? validatePhoneNumber(lead.alternatePhone) : { valid: true }

      // Mark lead with validation status
      lead.hasPhoneError = !phoneValidation.valid
      lead.hasAltPhoneError = !altPhoneValidation.valid
      lead.phoneErrorMessage = phoneValidation.message || ''
      lead.altPhoneErrorMessage = altPhoneValidation.message || ''

      // Validate employee assignment
      lead.hasAssignmentError = false
      lead.assignmentErrorMessage = ''
      if (lead.assignTo) {
        const employeeExists = users.some(u => 
          u.name.toLowerCase().includes(lead.assignTo.toLowerCase()) ||
          lead.assignTo.toLowerCase().includes(u.name.toLowerCase())
        )
        if (!employeeExists) {
          lead.hasAssignmentError = true
          lead.assignmentErrorMessage = `Employee "${lead.assignTo}" not found`
        }
      }

      // Note: Source is always set to "CSV Imports" during import, no validation needed

      if (!phoneValidation.valid || !altPhoneValidation.valid || lead.hasAssignmentError) {
        errors.push({
          rowIndex: i,
          lead,
          phoneError: !phoneValidation.valid ? phoneValidation.message : null,
          altPhoneError: !altPhoneValidation.valid ? altPhoneValidation.message : null,
          assignmentError: lead.hasAssignmentError ? lead.assignmentErrorMessage : null
        })
      }

      data.push(lead)
    }

    return { data, errors }
  }

  const normalizeStatus = (status) => {
    if (!status) return 'pending'
    
    const statusMap = {
      'yet to contact': 'pending',
      'no response': 'no-response',
      'not interested': 'not-interested',
      'qualified': 'qualified',
      'number inactive': 'number-inactive',
      'number switched off': 'number-switched-off',
      'on hold': 'on-hold',
      'no requirement': 'no-requirement',
      'follow up': 'follow-up',
      'disqualified': 'disqualified',
      'disconnected': 'disconnected',
      'already finalised': 'already-finalised',
      'already finalized': 'already-finalised'
    }
    
    const normalized = status.toLowerCase().trim()
    return statusMap[normalized] || 'pending'
  }

  const checkDatabaseDuplicates = async (leads) => {
    setCheckingDuplicates(true)
    const duplicates = []

    try {
      // Get all phone numbers from the CSV
      const phoneNumbers = []
      leads.forEach(lead => {
        if (lead.phone) phoneNumbers.push(lead.phone.replace(/\D/g, ''))
        if (lead.alternatePhone) phoneNumbers.push(lead.alternatePhone.replace(/\D/g, ''))
      })

      // Get auth token
      const token = localStorage.getItem('token')
      
      // Check against database
      const response = await fetch('/api/clients/check-duplicates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumbers })
      })

      if (!response.ok) {
        throw new Error('Failed to check duplicates')
      }

      const existingPhones = await response.json()
      
      // Ensure existingPhones is an array
      const existingPhoneArray = Array.isArray(existingPhones) ? existingPhones : []
      const existingPhoneSet = new Set(existingPhoneArray.map(p => p.replace(/\D/g, '')))

      // Mark leads with database duplicates
      leads.forEach(lead => {
        const cleanedPhone = lead.phone.replace(/\D/g, '')
        const cleanedAltPhone = lead.alternatePhone ? lead.alternatePhone.replace(/\D/g, '') : ''

        if (cleanedPhone && existingPhoneSet.has(cleanedPhone)) {
          lead.isDuplicateInDB = true
          duplicates.push({
            rowIndex: lead.rowIndex,
            lead,
            phoneIsDuplicate: true,
            altPhoneIsDuplicate: false
          })
        } else if (cleanedAltPhone && existingPhoneSet.has(cleanedAltPhone)) {
          lead.isDuplicateAltInDB = true
          if (!duplicates.find(d => d.rowIndex === lead.rowIndex)) {
            duplicates.push({
              rowIndex: lead.rowIndex,
              lead,
              phoneIsDuplicate: false,
              altPhoneIsDuplicate: true
            })
          }
        }
      })

      setDuplicateErrors(duplicates)
      
      // Show validation screen if there are duplicates
      if (duplicates.length > 0) {
        setShowValidation(true)
      }
    } catch (error) {
      console.error('Error checking duplicates:', error)
      // Continue without duplicate checking if there's an error
    } finally {
      setCheckingDuplicates(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setCsvFile(file)
    const reader = new FileReader()
    
    reader.onload = async (event) => {
      const text = event.target.result
      const { data, errors } = parseCSV(text)
      
      setParsedData(data)
      setValidationErrors(errors)
      
      // Check for duplicates in database
      await checkDatabaseDuplicates(data)
      
      if (errors.length > 0) {
        setShowValidation(true)
      }
    }
    
    reader.readAsText(file)
  }

  const handleEditRow = (rowIndex) => {
    const error = validationErrors.find(e => e.rowIndex === rowIndex)
    setEditingRow(rowIndex)
    setEditedData(error.lead)
  }

  const handleSaveEdit = () => {
    // Update the lead in parsedData
    const dataIndex = parsedData.findIndex(l => l.rowIndex === editingRow)
    if (dataIndex !== -1) {
      parsedData[dataIndex] = { ...editedData }
    }

    // Re-validate phone numbers
    const phoneValidation = validatePhoneNumber(editedData.phone)
    const altPhoneValidation = editedData.alternatePhone ? validatePhoneNumber(editedData.alternatePhone) : { valid: true }

    // Re-validate employee assignment
    let hasAssignmentError = false
    let assignmentErrorMessage = ''
    if (editedData.assignTo) {
      const employeeExists = users.some(u => 
        u.name.toLowerCase().includes(editedData.assignTo.toLowerCase()) ||
        editedData.assignTo.toLowerCase().includes(u.name.toLowerCase())
      )
      if (!employeeExists) {
        hasAssignmentError = true
        assignmentErrorMessage = `Employee "${editedData.assignTo}" not found`
      }
    }

    // Update error markers
    editedData.hasPhoneError = !phoneValidation.valid
    editedData.hasAltPhoneError = !altPhoneValidation.valid
    editedData.phoneErrorMessage = phoneValidation.message || ''
    editedData.altPhoneErrorMessage = altPhoneValidation.message || ''
    editedData.hasAssignmentError = hasAssignmentError
    editedData.assignmentErrorMessage = assignmentErrorMessage

    // Remove from errors if now valid
    if (phoneValidation.valid && altPhoneValidation.valid && !hasAssignmentError) {
      setValidationErrors(validationErrors.filter(e => e.rowIndex !== editingRow))
    } else {
      // Update error
      const errorIndex = validationErrors.findIndex(e => e.rowIndex === editingRow)
      if (errorIndex !== -1) {
        validationErrors[errorIndex] = {
          rowIndex: editingRow,
          lead: editedData,
          phoneError: !phoneValidation.valid ? phoneValidation.message : null,
          altPhoneError: !altPhoneValidation.valid ? altPhoneValidation.message : null,
          assignmentError: hasAssignmentError ? assignmentErrorMessage : null
        }
      }
    }

    setEditingRow(null)
    setEditedData({})
  }

  const handleImportAnyway = () => {
    // Filter out database duplicates
    const nonDuplicates = parsedData.filter(lead => 
      !lead.isDuplicateInDB && !lead.isDuplicateAltInDB
    )
    onImport(nonDuplicates, csvFile.name)
    handleClose()
  }

  const handleImportValid = () => {
    const validLeads = parsedData.filter(lead => 
      !validationErrors.some(e => e.rowIndex === lead.rowIndex) &&
      !lead.isDuplicateInDB && !lead.isDuplicateAltInDB
    )
    onImport(validLeads, csvFile.name)
    handleClose()
  }

  const handleImportSelected = () => {
    // Import all valid leads + selected leads with errors (excluding database duplicates)
    const leadsToImport = parsedData.filter(lead => {
      const hasError = validationErrors.some(e => e.rowIndex === lead.rowIndex)
      const isDuplicate = lead.isDuplicateInDB || lead.isDuplicateAltInDB
      // Include if: (no error OR has error but is selected) AND not a database duplicate
      return (!hasError || selectedLeads.has(lead.rowIndex)) && !isDuplicate
    })
    onImport(leadsToImport, csvFile.name)
    handleClose()
  }

  const toggleLeadSelection = (rowIndex) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex)
    } else {
      newSelected.add(rowIndex)
    }
    setSelectedLeads(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedLeads.size === validationErrors.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(validationErrors.map(e => e.rowIndex)))
    }
  }

  const handleClose = () => {
    setCsvFile(null)
    setParsedData([])
    setValidationErrors([])
    setDuplicateErrors([])
    setShowValidation(false)
    setEditingRow(null)
    setEditedData({})
    setSelectedLeads(new Set())
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Import Leads from CSV
          </h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
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
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  First Name, Last Name, Phone Number, Alternate Phone Number, Email, Project Name, Tags, Lead Status, etc.
                </p>
              </div>
            </div>
          ) : checkingDuplicates ? (
            <div className="text-center py-8">
              <div className="animate-spin h-16 w-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Checking for Duplicates...
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verifying phone numbers against existing leads
              </p>
            </div>
          ) : duplicateErrors.length === parsedData.length ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                All Leads Already Exist!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                All {parsedData.length} leads in this CSV file already exist in the database.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This CSV file appears to have been imported previously. No new leads to import.
              </p>
            </div>
          ) : duplicateErrors.length > 0 && validationErrors.length === 0 ? (
            <div>
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      Duplicate Phone Numbers Detected
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {duplicateErrors.length} lead(s) have phone numbers that already exist in the database. These will be automatically skipped.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                  {parsedData.length - duplicateErrors.length} New Leads Ready to Import
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {duplicateErrors.length} duplicate(s) will be skipped
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
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      {validationErrors.length} lead(s) have phone number issues. Check the ones you want to import (valid leads will be imported automatically).
                    </p>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-yellow-800 dark:text-yellow-200 underline hover:no-underline"
                    >
                      {selectedLeads.size === validationErrors.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Duplicate Warnings */}
              {duplicateErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        Duplicate Phone Numbers Detected
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {duplicateErrors.length} lead(s) have phone numbers that already exist in the database. These will be automatically skipped.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                {validationErrors.map((error) => {
                  const isDuplicate = error.lead.isDuplicateInDB || error.lead.isDuplicateAltInDB || 
                                     error.lead.isDuplicateInCSV || error.lead.isDuplicateAltInCSV
                  
                  return (
                  <div key={error.rowIndex} className={`border rounded-lg p-4 ${
                    isDuplicate 
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' 
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                  }`}>
                    {editingRow === error.rowIndex ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={editedData.name || ''}
                              onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Phone *
                            </label>
                            <input
                              type="text"
                              value={editedData.phone || ''}
                              onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Alternate Phone
                            </label>
                            <input
                              type="text"
                              value={editedData.alternatePhone || ''}
                              onChange={(e) => setEditedData({ ...editedData, alternatePhone: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editedData.email || ''}
                              onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          {error.assignmentError && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Assign To *
                              </label>
                              <select
                                value={editedData.assignTo || ''}
                                onChange={(e) => setEditedData({ ...editedData, assignTo: e.target.value })}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              >
                                <option value="">Select employee...</option>
                                {users.map((u) => (
                                  <option key={u._id} value={u.name}>{u.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(error.rowIndex)}
                          onChange={() => toggleLeadSelection(error.rowIndex)}
                          disabled={isDuplicate}
                          className={`h-4 w-4 focus:ring-primary-500 border-gray-300 rounded mt-1 mr-3 ${
                            isDuplicate 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'text-primary-600 cursor-pointer'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                Row {error.rowIndex}: {error.lead.name || 'Unnamed'}
                                {isDuplicate && (
                                  <span className="ml-2 text-xs text-red-600 dark:text-red-400 font-semibold">
                                    (DUPLICATE - WILL BE SKIPPED)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {error.lead.company}
                              </p>
                            </div>
                            {!isDuplicate && (
                              <button
                                onClick={() => handleEditRow(error.rowIndex)}
                                className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edit
                              </button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {error.phoneError && (
                              <div className="flex items-center text-xs text-red-700 dark:text-red-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Phone: {error.lead.phone} - {error.phoneError}
                              </div>
                            )}
                            {error.altPhoneError && (
                              <div className="flex items-center text-xs text-red-700 dark:text-red-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alt Phone: {error.lead.alternatePhone} - {error.altPhoneError}
                              </div>
                            )}
                            {error.assignmentError && (
                              <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Assignment: {error.assignmentError}
                              </div>
                            )}
                            {error.lead.isDuplicateInDB && (
                              <div className="flex items-center text-xs text-red-700 dark:text-red-300 font-medium">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Phone number already exists in database
                              </div>
                            )}
                            {error.lead.isDuplicateAltInDB && (
                              <div className="flex items-center text-xs text-red-700 dark:text-red-300 font-medium">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alternate phone number already exists in database
                              </div>
                            )}
                            {error.lead.isDuplicateInCSV && (
                              <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Phone number duplicated in CSV (Row {error.lead.duplicateCSVRow})
                              </div>
                            )}
                            {error.lead.isDuplicateAltInCSV && (
                              <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Alternate phone duplicated in CSV (Row {error.lead.duplicateAltCSVRow})
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )})}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                CSV Parsed Successfully!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {parsedData.length} leads ready to import
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {csvFile && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {parsedData.length} total leads
              {validationErrors.length > 0 && (
                <span className="ml-2 text-yellow-600 dark:text-yellow-400">
                  · {validationErrors.length} with issues
                </span>
              )}
              {duplicateErrors.length > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  · {duplicateErrors.length} duplicates
                </span>
              )}
              {duplicateErrors.length > 0 && parsedData.length > duplicateErrors.length && (
                <span className="ml-2 text-green-600 dark:text-green-400">
                  · {parsedData.filter(lead => !lead.isDuplicateInDB && !lead.isDuplicateAltInDB).length} new leads
                </span>
              )}
              {selectedLeads.size > 0 && (
                <span className="ml-2 text-purple-600 dark:text-purple-400">
                  · {selectedLeads.size} selected
                </span>
              )}
              {checkingDuplicates && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  · Checking duplicates...
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {duplicateErrors.length === parsedData.length ? 'Close' : 'Cancel'}
              </button>
              {duplicateErrors.length < parsedData.length && (
                <>
                  {validationErrors.length > 0 && selectedLeads.size > 0 && (
                    <button
                      onClick={handleImportSelected}
                      disabled={checkingDuplicates}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Import Selected ({
                        parsedData.filter(lead => {
                          const hasError = validationErrors.some(e => e.rowIndex === lead.rowIndex)
                          const isDuplicate = lead.isDuplicateInDB || lead.isDuplicateAltInDB
                          return (!hasError || selectedLeads.has(lead.rowIndex)) && !isDuplicate
                        }).length
                      })
                    </button>
                  )}
                  {validationErrors.length > 0 && (
                    <button
                      onClick={handleImportValid}
                      disabled={checkingDuplicates}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Import Valid Only ({
                        parsedData.filter(lead => 
                          !validationErrors.some(e => e.rowIndex === lead.rowIndex) &&
                          !lead.isDuplicateInDB && !lead.isDuplicateAltInDB
                        ).length
                      })
                    </button>
                  )}
                  <button
                    onClick={handleImportAnyway}
                    disabled={checkingDuplicates}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import New Leads ({
                      parsedData.filter(lead => 
                        !lead.isDuplicateInDB && !lead.isDuplicateAltInDB
                      ).length
                    })
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CsvImportModal

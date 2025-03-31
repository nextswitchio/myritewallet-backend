module.exports = {
  success: (data = null, message = 'Success') => {
    return { success: true, message, data };
  },

  error: (message = 'Error', code = null, details = null) => {
    return { 
      success: false, 
      error: { message, code, details } 
    };
  },

  validationError: (errors) => {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    };
  }
};
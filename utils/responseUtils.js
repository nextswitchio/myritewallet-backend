module.exports = {
  /**
   * Send a success response.
   * @param {object} res - The Express response object.
   * @param {string} [message='Success'] - A success message.
   * @param {object} [data={}] - The data to include in the response.
   * @param {number} [statusCode=200] - The HTTP status code (default: 200).
   */
  sendSuccess: (res, message = 'Success', data = {}, statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      message,
      data
    });
  },

  /**
   * Send an error response.
   * @param {object} res - The Express response object.
   * @param {string} [message='Error'] - An error message.
   * @param {number} [statusCode=500] - The HTTP status code (default: 500).
   * @param {object} [errors={}] - Additional error details (optional).
   */
  sendError: (res, message = 'Error', statusCode = 500, errors = {}) => {
    res.status(statusCode).json({
      success: false,
      error: {
        message,
        code: statusCode,
        details: errors
      }
    });
  },

  /**
   * Send a validation error response.
   * @param {object} res - The Express response object.
   * @param {object[]} errors - An array of validation errors.
   * @param {number} [statusCode=400] - The HTTP status code (default: 400).
   */
  sendValidationError: (res, errors, statusCode = 400) => {
    res.status(statusCode).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }
    });
  },

  /**
   * Send a paginated response.
   * @param {object} res - The Express response object.
   * @param {string} message - A success message.
   * @param {object[]} items - The items to include in the response.
   * @param {number} totalItems - The total number of items.
   * @param {number} currentPage - The current page number.
   * @param {number} pageSize - The number of items per page.
   * @param {number} [statusCode=200] - The HTTP status code (default: 200).
   */
  sendPaginatedResponse: (res, message, items, totalItems, currentPage, pageSize, statusCode = 200) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    res.status(statusCode).json({
      success: true,
      message,
      data: {
        items,
        pagination: {
          totalItems,
          totalPages,
          currentPage,
          pageSize
        }
      }
    });
  },

  /**
   * Generate a success response object (non-Express).
   * @param {object} [data=null] - The data to include in the response.
   * @param {string} [message='Success'] - A success message.
   * @returns {object} - The success response object.
   */
  success: (data = null, message = 'Success') => {
    return { success: true, message, data };
  },

  /**
   * Generate an error response object (non-Express).
   * @param {string} [message='Error'] - An error message.
   * @param {string|null} [code=null] - An optional error code.
   * @param {object|null} [details=null] - Additional error details.
   * @returns {object} - The error response object.
   */
  error: (message = 'Error', code = null, details = null) => {
    return {
      success: false,
      error: { message, code, details }
    };
  }
};
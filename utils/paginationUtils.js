module.exports = {
  /**
   * Calculate pagination parameters (offset and limit) based on the current page and page size.
   * @param {number} page - The current page number (default: 1).
   * @param {number} pageSize - The number of items per page (default: 10).
   * @returns {object} - An object containing `offset` and `limit`.
   */
  getPagination: (page = 1, pageSize = 10) => {
    const limit = Math.max(pageSize, 1); // Ensure pageSize is at least 1
    const offset = (Math.max(page, 1) - 1) * limit; // Ensure page is at least 1
    return { offset, limit };
  },

  /**
   * Format paginated results into a standardized response.
   * @param {object[]} items - The items for the current page.
   * @param {number} totalItems - The total number of items.
   * @param {number} currentPage - The current page number.
   * @param {number} pageSize - The number of items per page.
   * @returns {object} - A formatted paginated response.
   */
  getPaginatedResponse: (items, totalItems, currentPage, pageSize) => {
    const totalPages = Math.ceil(totalItems / pageSize);
    return {
      success: true,
      message: 'Paginated results retrieved successfully.',
      data: {
        items,
        pagination: {
          totalItems,
          totalPages,
          currentPage,
          pageSize
        }
      }
    };
  }
};
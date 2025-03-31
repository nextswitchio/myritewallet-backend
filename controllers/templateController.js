const { BulkTemplate, TemplateVersion } = require('../models');

module.exports = {
  createTemplate: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { name, description, template } = req.body;

      // Create template
      const newTemplate = await BulkTemplate.create({
        name,
        description,
        creatorId: req.user.id
      }, { transaction: t });

      // Initial version
      await TemplateVersion.create({
        version: '1.0',
        templateData: template,
        isActive: true,
        creatorId: req.user.id,
        bulkTemplateId: newTemplate.id
      }, { transaction: t });

      await t.commit();
      res.status(201).json(newTemplate);
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  updateTemplate: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { changes, reason } = req.body;

      // Get current version
      const current = await TemplateVersion.findOne({
        where: { 
          bulkTemplateId: id,
          isActive: true 
        },
        transaction: t
      });

      // Create new version
      const newVersion = await TemplateVersion.create({
        version: incrementVersion(current.version),
        templateData: { ...current.templateData, ...changes },
        changeReason: reason,
        creatorId: req.user.id,
        bulkTemplateId: id
      }, { transaction: t });

      // Initiate approval if major change
      if (isMajorChange(current.templateData, newVersion.templateData)) {
        await vfdService.initiateApprovalFlow(
          `template_update_${newVersion.id}`,
          'template_change',
          {
            templateId: id,
            versionFrom: current.version,
            versionTo: newVersion.version,
            changes
          }
        );
      } else {
        // Auto-activate minor changes
        await current.update({ isActive: false }, { transaction: t });
        await newVersion.update({ isActive: true }, { transaction: t });
      }

      await t.commit();
      res.json(newVersion);
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  }
};

function isMajorChange(oldData, newData) {
  // Implement business rules for major vs minor changes
  return JSON.stringify(oldData) !== JSON.stringify(newData);
}

function incrementVersion(version) {
  const [major, minor] = version.split('.').map(Number);
  return `${major}.${minor + 1}`;
}
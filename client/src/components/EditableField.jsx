function EditableField({
  label,
  value,
  field,
  type = 'text',
  icon,
  unit,
  isEditing,
  tempData,
  handleInputChange
}) {
  return (
    <div className="profile-field">
      <div className="field-icon">{icon}</div>

      <div className="field-content">
        <label>{label}</label>

        {isEditing ? (
          <input
            type={type}
            value={tempData[field] || ''}
            onChange={(e) =>
              handleInputChange(
                field,
                type === 'number'
                  ? parseFloat(e.target.value) || 0
                  : e.target.value
              )
            }
            className="field-input"
          />
        ) : (
          <div className="field-value">
            {value}
            {unit && <span className="field-unit">{unit}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default EditableField;
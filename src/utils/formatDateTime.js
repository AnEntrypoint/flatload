export const formatDateTime = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date()
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const DD = String(date.getDate()).padStart(2, '0')
  return `${MM}/${DD}/${date.getFullYear()}`
}

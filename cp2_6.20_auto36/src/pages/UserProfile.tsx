import { useParams } from 'react-router-dom'

function UserProfile() {
  const { id } = useParams()

  return (
    <div className="user-profile">
      <h1>用户个人页</h1>
      <p>用户ID: {id}</p>
    </div>
  )
}

export default UserProfile

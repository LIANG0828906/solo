import { useParams } from 'react-router-dom'

function AuctionDetail() {
  const { id } = useParams()

  return (
    <div className="auction-detail">
      <h1>拍品详情</h1>
      <p>拍品ID: {id}</p>
    </div>
  )
}

export default AuctionDetail

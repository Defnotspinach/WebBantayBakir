import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TreeDetails {
  commonName?: string
  scientificName?: string
  treeNum?: string
  dbh_cm?: number | string
  mh_m?: number | string
  volume_m3?: number | string
  latitude?: number
  longitude?: number
  imageUrl?: string
  createdBy?: string
  createdAt?: { seconds?: number } | string
}

export default function PublicTreeDetailsPage() {
  const { id } = useParams()
  const [tree, setTree] = useState<TreeDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadTree = async () => {
      if (!id) return
      setIsLoading(true)
      try {
        const snap = await getDoc(doc(db, "trees", id))
        if (snap.exists()) {
          setTree(snap.data() as TreeDetails)
        } else {
          setTree(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadTree()
  }, [id])

  const createdDate =
    tree?.createdAt && typeof tree.createdAt === "object" && "seconds" in tree.createdAt
      ? new Date((tree.createdAt.seconds ?? 0) * 1000).toLocaleString()
      : typeof tree?.createdAt === "string"
        ? new Date(tree.createdAt).toLocaleString()
        : "Unknown"

  return (
    <div className="p-8 w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Tree Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p>Loading...</p> : null}
          {!isLoading && !tree ? <p>Tree not found.</p> : null}
          {!isLoading && tree ? (
            <>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">
                  {tree.commonName || tree.scientificName || tree.treeNum || "Unnamed Tree"}
                </h2>
                <Badge variant="secondary">Public View</Badge>
              </div>
              {tree.imageUrl ? (
                <img
                  src={tree.imageUrl}
                  alt={tree.commonName || "Tree"}
                  className="w-full max-h-80 object-cover rounded-xl border"
                />
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <p>Tree Number: {tree.treeNum || "N/A"}</p>
                <p>DBH: {tree.dbh_cm ?? "N/A"}</p>
                <p>Height: {tree.mh_m ?? "N/A"}</p>
                <p>Volume: {tree.volume_m3 ?? "N/A"}</p>
                <p>
                  Coordinates: {tree.latitude ?? "N/A"}, {tree.longitude ?? "N/A"}
                </p>
                <p>Added by: {tree.createdBy || "Unknown"}</p>
                <p>Date: {createdDate}</p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

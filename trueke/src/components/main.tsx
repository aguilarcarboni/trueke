import { getUsers } from "@/utils/supabase/tables/user";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";
import { DataTable } from "./misc/DataTable";

const Main = async () => {

  const { data, error } = await getUsers()

  if (error) {
    return <div className="flex flex-col w-full h-full">
      <p>{error.message}</p>
    </div>
  }

  return (
    <div className="flex flex-col w-full h-full items-center justify-center">
      {data && data.length > 0 && (
        <Card className="w-fit h-fit">
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={data} />
          </CardContent>
        </Card>
      )}  
    </div>
  )

};

export default Main;
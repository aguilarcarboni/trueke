interface ItemPageProps {
  params: Promise<{ id: string }>;
}

async function getItem(id: string) {
  const res = await fetch(`http://localhost:3000/api/items/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { id } = await params;
  const data = await getItem(id);

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Item not found</h1>
      </div>
    );
  }

  const { item, owner } = data;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{item.title}</h1>
        <p className="text-muted-foreground">Item created successfully.</p>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <p>
          <strong>Description:</strong> {item.description}
        </p>
        <p>
          <strong>Category:</strong> {item.category}
        </p>
        <p>
          <strong>Condition:</strong> {item.condition}
        </p>
        <p>
          <strong>Status:</strong> {item.status}
        </p>
        <p>
          <strong>Type:</strong> {item.item_type}
        </p>
        <p>
          <strong>Date Bought:</strong> {item.date_bought ?? "Not provided"}
        </p>
      </div>

      <div className="rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold">Owner</h2>
        <p>
          {owner.first_name} {owner.last_name}
        </p>
        <p className="text-muted-foreground">@{owner.username}</p>
      </div>

      <a href="/" className="inline-block underline">
        Back to Dashboard
      </a>
    </div>
  );
}

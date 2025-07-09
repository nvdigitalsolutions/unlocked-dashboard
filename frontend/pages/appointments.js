import { useEffect, useState } from 'react';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.BACKEND_URL}/api/appointments`);
        const data = await res.json();
        setAppointments(data.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div>
      <h1>Appointments</h1>
      <ul>
        {appointments.map((a) => (
          <li key={a.id}>{a.attributes.title}</li>
        ))}
      </ul>
    </div>
  );
}

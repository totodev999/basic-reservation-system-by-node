import { Link } from 'react-router';

function Start() {
  return (
    <div>
      <div className="grid place-items-center min-h-screen text-center">
        <div>
          <h2 className="text-lg font-bold">Reservation System</h2>
          <div className="mt-4">
            <Link className="bg-teal-600 text-white p-2 rounded-md" to="/type">
              Make a reservation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Start;
